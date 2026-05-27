import { randomBytes } from "node:crypto";
import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  ORDER_CACHE_KEY_PREFIX,
  PAYMENT_CACHE_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../config/constants";
import { env, isProduction } from "../config/env";
import { Logger } from "../config/logger";
import { Order } from "../entities/Order";
import { Reservation } from "../entities/Reservation";
import { Ticket } from "../entities/Ticket";
import { TicketLot } from "../entities/TicketLot";
import { User } from "../entities/User";
import {
  OrderStatus,
  ReservationStatus,
  TicketStatus,
} from "../entities/enums";
import {
  InvalidWebhookPayloadError,
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
  PaymentAlreadyProcessedError,
} from "../errors/PaymentError";
import type { PaymentGateway } from "./payment/PaymentGateway";
import {
  createPaymentGateway,
  isMercadoPagoPixGateway,
} from "./payment/createPaymentGateway";

const CONTEXT = "PaymentService";

export type PaymentWebhookEventType = "payment.succeeded" | "payment.failed";

export interface PaymentWebhookPayload {
  event: PaymentWebhookEventType;
  data: {
    transactionId: string;
    orderId: string;
    paidAt?: string;
    failureReason?: string;
  };
}

export interface PixPaymentDetails {
  orderId: string;
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: string;
  amountCents: number;
}

export interface RefundOrderResult {
  orderId: string;
  ticketsCancelled: number;
  stockRestored: number;
}

export class PaymentService {
  private readonly logger = Logger.getInstance();
  private readonly gateway: PaymentGateway;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redis?: Redis,
    gateway?: PaymentGateway,
  ) {
    this.gateway = gateway ?? createPaymentGateway();
  }

  getGatewayProvider(): PaymentGateway["provider"] {
    return this.gateway.provider;
  }

  async processOrderPayment(orderId: string): Promise<PixPaymentDetails> {
    this.logger.info(CONTEXT, "Starting PIX charge creation", { orderId });

    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId },
      relations: { reservation: { ticketLot: true }, user: true },
    });

    if (!order?.user) {
      throw new OrderNotFoundError(orderId);
    }

    const charge = await this.gateway.createPixCharge({
      orderId: order.id,
      amountCents: order.totalPrice,
      description: `Ingressos pedido ${order.id.slice(0, 8)}`,
      payerEmail: order.user.email,
      payerFirstName: order.user.name.split(" ")[0] ?? order.user.name,
      payerDocument: order.user.document,
    });

    order.paymentGatewayId = charge.transactionId;
    await this.dataSource.getRepository(Order).save(order);

    this.logger.info(CONTEXT, "PIX charge created", {
      orderId: order.id,
      transactionId: charge.transactionId,
      amountCents: order.totalPrice,
      expiresAt: charge.expiresAt.toISOString(),
    });

    return {
      orderId: order.id,
      transactionId: charge.transactionId,
      pixCopyPaste: charge.pixCopyPaste,
      expiresAt: charge.expiresAt.toISOString(),
      amountCents: order.totalPrice,
    };
  }

  async refundOrder(orderId: string): Promise<RefundOrderResult> {
    this.logger.info(CONTEXT, "Starting order refund", { orderId });

    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status === OrderStatus.REFUNDED) {
      throw new OrderAlreadyRefundedError(orderId);
    }

    if (order.status !== OrderStatus.PAID) {
      throw new OrderRefundNotAllowedError(
        `Order ${orderId} with status ${order.status} cannot be refunded`,
      );
    }

    const tickets = await this.dataSource.getRepository(Ticket).find({
      where: { orderId },
    });

    const hasUsedTicket = tickets.some(
      (ticket) =>
        ticket.status === TicketStatus.USED || ticket.checkedInAt !== null,
    );

    if (hasUsedTicket) {
      throw new OrderRefundNotAllowedError(
        `Order ${orderId} has used tickets and cannot be refunded`,
        "TICKET_ALREADY_USED",
      );
    }

    if (order.paymentGatewayId) {
      await this.gateway.refundPayment(order.paymentGatewayId);
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const lockedOrder = await manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: "pessimistic_write" },
      });

      if (!lockedOrder) {
        throw new OrderNotFoundError(orderId);
      }

      if (lockedOrder.status === OrderStatus.REFUNDED) {
        throw new OrderAlreadyRefundedError(orderId);
      }

      if (lockedOrder.status !== OrderStatus.PAID) {
        throw new OrderRefundNotAllowedError(
          `Order ${orderId} with status ${lockedOrder.status} cannot be refunded`,
        );
      }

      const orderTickets = await manager.find(Ticket, {
        where: { orderId },
        lock: { mode: "pessimistic_write" },
      });

      const activeTickets = orderTickets.filter(
        (ticket) => ticket.status === TicketStatus.ACTIVE,
      );

      const checkedIn = orderTickets.some(
        (ticket) =>
          ticket.status === TicketStatus.USED || ticket.checkedInAt !== null,
      );

      if (checkedIn) {
        throw new OrderRefundNotAllowedError(
          `Order ${orderId} has checked-in tickets and cannot be refunded`,
          "TICKET_ALREADY_USED",
        );
      }

      for (const ticket of activeTickets) {
        ticket.status = TicketStatus.CANCELLED;
        await manager.save(ticket);
      }

      const stockByLot = new Map<string, number>();
      for (const ticket of activeTickets) {
        stockByLot.set(
          ticket.ticketLotId,
          (stockByLot.get(ticket.ticketLotId) ?? 0) + 1,
        );
      }

      let stockRestored = 0;

      for (const [ticketLotId, quantity] of stockByLot) {
        const ticketLot = await manager.findOne(TicketLot, {
          where: { id: ticketLotId },
          lock: { mode: "pessimistic_write" },
        });

        if (!ticketLot) {
          this.logger.error(CONTEXT, "Ticket lot not found during refund", {
            orderId,
            ticketLotId,
          });
          continue;
        }

        ticketLot.availableQuantity += quantity;
        await manager.save(ticketLot);
        stockRestored += quantity;

        if (this.redis) {
          await this.redis.incrby(
            `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLotId}`,
            quantity,
          );
        }
      }

      lockedOrder.status = OrderStatus.REFUNDED;
      await manager.save(lockedOrder);

      this.logger.info(CONTEXT, "Order refunded successfully", {
        orderId,
        ticketsCancelled: activeTickets.length,
        stockRestored,
      });

      return {
        orderId,
        ticketsCancelled: activeTickets.length,
        stockRestored,
      };
    });

    await this.clearPaymentCache(orderId);
    await this.clearReservationCache(orderId);

    return result;
  }

  async simulateDevPayment(orderId: string, requesterUserId: string): Promise<void> {
    if (isProduction) {
      throw new InvalidWebhookPayloadError("Dev payment simulation is disabled in production");
    }

    if (env.payment.gateway !== "simulated") {
      throw new InvalidWebhookPayloadError(
        "Dev payment simulation requires PAYMENT_GATEWAY=simulated",
      );
    }

    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.userId !== requesterUserId) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(orderId, order.status);
    }

    await this.handleWebhook({
      event: "payment.succeeded",
      data: {
        orderId: order.id,
        transactionId: order.paymentGatewayId ?? `pix_sim_dev_${order.id}`,
        paidAt: new Date().toISOString(),
      },
    });
  }

  async handleWebhook(payload: PaymentWebhookPayload): Promise<void> {
    this.validateWebhookPayload(payload);

    this.logger.info(CONTEXT, "Webhook received", {
      event: payload.event,
      orderId: payload.data.orderId,
      transactionId: payload.data.transactionId,
    });

    if (payload.event === "payment.succeeded") {
      await this.handlePaymentSucceeded(payload.data);
      return;
    }

    await this.handlePaymentFailed(payload.data);
  }

  async expireUnpaidOrderByReservationId(reservationId: string): Promise<boolean> {
    this.logger.info(CONTEXT, "Expiring unpaid order by reservation TTL", {
      reservationId,
    });

    let orderId: string | null = null;

    const expired = await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(Reservation, {
        where: { id: reservationId },
        lock: { mode: "pessimistic_write" },
      });

      if (!reservation) {
        this.logger.warn(
          CONTEXT,
          "Reservation not found on expiry (likely not persisted yet)",
          { reservationId },
        );
        return false;
      }

      if (reservation.status !== ReservationStatus.PENDING) {
        this.logger.info(CONTEXT, "Skipping expiry — reservation is no longer pending", {
          reservationId,
          status: reservation.status,
        });
        return false;
      }

      const order = await manager.findOne(Order, {
        where: { reservationId },
        lock: { mode: "pessimistic_write" },
      });

      if (order?.status === OrderStatus.PENDING) {
        order.status = OrderStatus.FAILED;
        await manager.save(order);
        orderId = order.id;
      }

      reservation.status = ReservationStatus.EXPIRED;
      await manager.save(reservation);

      const ticketLot = await manager.findOne(TicketLot, {
        where: { id: reservation.ticketLotId },
        lock: { mode: "pessimistic_write" },
      });

      if (!ticketLot) {
        this.logger.error(CONTEXT, "Ticket lot not found when restoring stock on expiry", {
          reservationId,
          ticketLotId: reservation.ticketLotId,
        });
        return Boolean(orderId);
      }

      ticketLot.availableQuantity += reservation.quantity;
      await manager.save(ticketLot);

      if (this.redis) {
        const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLot.id}`;
        await this.redis.incrby(stockKey, reservation.quantity);
      }

      this.logger.info(CONTEXT, "Unpaid order expired — stock restored", {
        reservationId,
        orderId,
        ticketLotId: ticketLot.id,
        quantity: reservation.quantity,
        availableQuantity: ticketLot.availableQuantity,
      });

      return true;
    });

    if (orderId) {
      await this.clearReservationCache(orderId);
      await this.clearPaymentCache(orderId);
    }

    return expired;
  }

  async handleMercadoPagoNotification(paymentId: string): Promise<"processed" | "pending" | "ignored"> {
    if (!isMercadoPagoPixGateway(this.gateway)) {
      throw new InvalidWebhookPayloadError("Mercado Pago gateway is not configured");
    }

    const snapshot = await this.gateway.getPayment(paymentId);

    this.logger.info(CONTEXT, "Mercado Pago payment fetched", {
      paymentId,
      orderId: snapshot.orderId,
      status: snapshot.status,
    });

    if (snapshot.status === "pending") {
      return "pending";
    }

    if (snapshot.status === "approved") {
      await this.handleWebhook({
        event: "payment.succeeded",
        data: {
          orderId: snapshot.orderId,
          transactionId: snapshot.transactionId,
          paidAt: new Date().toISOString(),
        },
      });
      return "processed";
    }

    if (
      snapshot.status === "rejected" ||
      snapshot.status === "cancelled" ||
      snapshot.status === "failed"
    ) {
      await this.handleWebhook({
        event: "payment.failed",
        data: {
          orderId: snapshot.orderId,
          transactionId: snapshot.transactionId,
          failureReason: snapshot.failureReason ?? snapshot.status,
        },
      });
      return "processed";
    }

    return "ignored";
  }

  private async handlePaymentSucceeded(
    data: PaymentWebhookPayload["data"],
  ): Promise<void> {
    this.logger.info(CONTEXT, "Processing payment success", {
      orderId: data.orderId,
      transactionId: data.transactionId,
    });

    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: data.orderId },
        lock: { mode: "pessimistic_write" },
      });

      if (!order) {
        throw new OrderNotFoundError(data.orderId);
      }

      if (order.status === OrderStatus.PAID) {
        this.logger.warn(CONTEXT, "Payment success ignored — order already paid", {
          orderId: order.id,
        });
        throw new PaymentAlreadyProcessedError(order.id, order.status);
      }

      if (order.status !== OrderStatus.PENDING) {
        this.logger.warn(CONTEXT, "Payment success ignored — invalid order status", {
          orderId: order.id,
          status: order.status,
        });
        throw new PaymentAlreadyProcessedError(order.id, order.status);
      }

      const reservation = await manager.findOne(Reservation, {
        where: { id: order.reservationId },
        lock: { mode: "pessimistic_write" },
      });

      if (!reservation) {
        this.logger.error(CONTEXT, "Reservation not found for paid order", {
          orderId: order.id,
          reservationId: order.reservationId,
        });
        throw new OrderNotFoundError(data.orderId);
      }

      if (reservation.status !== ReservationStatus.PENDING) {
        this.logger.warn(CONTEXT, "Payment success on non-pending reservation", {
          orderId: order.id,
          reservationId: reservation.id,
          reservationStatus: reservation.status,
        });
        throw new PaymentAlreadyProcessedError(
          order.id,
          reservation.status,
        );
      }

      const user = await manager.findOne(User, {
        where: { id: order.userId },
      });

      if (!user) {
        this.logger.error(CONTEXT, "User not found for paid order", {
          orderId: order.id,
          userId: order.userId,
        });
        throw new OrderNotFoundError(data.orderId);
      }

      order.status = OrderStatus.PAID;
      order.paymentGatewayId = data.transactionId;
      await manager.save(order);

      reservation.status = ReservationStatus.COMPLETED;
      await manager.save(reservation);

      const tickets: Ticket[] = [];

      for (let index = 0; index < reservation.quantity; index += 1) {
        const ticket = manager.create(Ticket, {
          orderId: order.id,
          ticketLotId: reservation.ticketLotId,
          ownerName: user.name,
          ownerDocument: user.document,
          uniqueCode: randomBytes(32).toString("hex"),
          status: TicketStatus.ACTIVE,
        });

        tickets.push(await manager.save(ticket));
      }

      this.logger.info(CONTEXT, "Payment succeeded — tickets issued", {
        orderId: order.id,
        reservationId: reservation.id,
        transactionId: data.transactionId,
        ticketsCreated: tickets.length,
        ticketIds: tickets.map((ticket) => ticket.id),
      });
    });

    await this.clearReservationCache(data.orderId);
    await this.clearPaymentCache(data.orderId);
  }

  private async handlePaymentFailed(
    data: PaymentWebhookPayload["data"],
  ): Promise<void> {
    this.logger.warn(CONTEXT, "Processing payment failure", {
      orderId: data.orderId,
      transactionId: data.transactionId,
      failureReason: data.failureReason,
    });

    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: data.orderId },
        lock: { mode: "pessimistic_write" },
      });

      if (!order) {
        throw new OrderNotFoundError(data.orderId);
      }

      if (order.status === OrderStatus.FAILED) {
        this.logger.info(CONTEXT, "Payment failure ignored — order already failed", {
          orderId: order.id,
        });
        return;
      }

      if (order.status === OrderStatus.PAID) {
        this.logger.error(CONTEXT, "Cannot fail order that is already paid", {
          orderId: order.id,
        });
        throw new PaymentAlreadyProcessedError(order.id, order.status);
      }

      order.status = OrderStatus.FAILED;
      order.paymentGatewayId = data.transactionId;
      await manager.save(order);

      const reservation = await manager.findOne(Reservation, {
        where: { id: order.reservationId },
        lock: { mode: "pessimistic_write" },
      });

      if (!reservation || reservation.status !== ReservationStatus.PENDING) {
        this.logger.info(CONTEXT, "Payment failed — reservation not restored", {
          orderId: order.id,
          reservationId: order.reservationId,
          reservationStatus: reservation?.status,
        });
        return;
      }

      reservation.status = ReservationStatus.EXPIRED;
      await manager.save(reservation);

      const ticketLot = await manager.findOne(TicketLot, {
        where: { id: reservation.ticketLotId },
        lock: { mode: "pessimistic_write" },
      });

      if (ticketLot) {
        ticketLot.availableQuantity += reservation.quantity;
        await manager.save(ticketLot);

        if (this.redis) {
          const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLot.id}`;
          await this.redis.incrby(stockKey, reservation.quantity);
        }

        this.logger.info(CONTEXT, "Payment failed — stock restored to lot", {
          orderId: order.id,
          reservationId: reservation.id,
          ticketLotId: ticketLot.id,
          quantityRestored: reservation.quantity,
          availableQuantity: ticketLot.availableQuantity,
        });
      }
    });

    await this.clearReservationCache(data.orderId);
    await this.clearPaymentCache(data.orderId);
  }

  private async clearReservationCache(orderId: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId },
      select: { id: true, reservationId: true },
    });

    if (!order) {
      return;
    }

    const cacheKey = `${RESERVATION_KEY_PREFIX}${order.reservationId}`;
    await this.redis.del(cacheKey);

    this.logger.debug(CONTEXT, "Reservation cache key removed after payment", {
      orderId,
      reservationId: order.reservationId,
      redisKey: cacheKey,
    });
  }

  private async clearPaymentCache(orderId: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId },
      select: { id: true, reservationId: true },
    });

    if (!order) {
      return;
    }

    await this.redis.del(`${PAYMENT_CACHE_KEY_PREFIX}${order.reservationId}`);
    await this.redis.del(`${ORDER_CACHE_KEY_PREFIX}${order.reservationId}`);

    this.logger.debug(CONTEXT, "Payment cache keys removed", {
      orderId,
      reservationId: order.reservationId,
    });
  }

  private validateWebhookPayload(payload: PaymentWebhookPayload): void {
    if (!payload?.event || !payload?.data) {
      throw new InvalidWebhookPayloadError("Missing event or data");
    }

    if (
      payload.event !== "payment.succeeded" &&
      payload.event !== "payment.failed"
    ) {
      throw new InvalidWebhookPayloadError(`Unsupported event: ${payload.event}`);
    }

    if (!payload.data.orderId || !payload.data.transactionId) {
      throw new InvalidWebhookPayloadError(
        "orderId and transactionId are required",
      );
    }
  }
}
