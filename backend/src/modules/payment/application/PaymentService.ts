/**
 * @file Orquestração de PIX, webhooks, expiração de reservas e reembolsos.
 * @module payment/application/PaymentService
 */

import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  ORDER_CACHE_KEY_PREFIX,
  PAYMENT_CACHE_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
  RESERVATION_TTL_SECONDS,
} from "../../../shared/infrastructure/config/constants";
import { env, isProduction } from "../../../shared/infrastructure/config/env";
import { Logger } from "../../../shared/infrastructure/config/logger";
import type { Order } from "../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus, TicketStatus } from "../../../shared/kernel/enums";
import {
  InvalidWebhookPayloadError,
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
  PaymentAlreadyProcessedError,
  PaymentGatewayError,
} from "../domain/errors/PaymentError";
import type { PaymentGateway, PixChargeResult } from "../infrastructure/gateways/PaymentGateway";
import {
  createPaymentGateway,
  isMercadoPagoPixGateway,
} from "../infrastructure/gateways/createPaymentGateway";
import { expireUnpaidOrderByReservationId as expireUnpaidOrderCommand } from "./commands/expireUnpaidOrderByReservationId";
import { processPaymentFailed } from "./commands/processPaymentFailed";
import { processPaymentSucceeded } from "./commands/processPaymentSucceeded";
import { refundOrder as refundOrderCommand } from "./commands/refundOrder";
import { updateOrder } from "./commands/updateOrder";
import { updateOrderPixFields } from "./commands/updateOrderPixFields";
import { findOneOrderById } from "./queries/findOneOrderById";
import { findOneOrderByIdWithPaymentRelations } from "./queries/findOneOrderByIdWithPaymentRelations";
import { findOneOrderReservationIdById } from "./queries/findOneOrderReservationIdById";
import { findTicketsByOrderId } from "./queries/findTicketsByOrderId";

const CONTEXT = "PaymentService";

/** Tipos de evento aceitos no webhook interno. */
export type PaymentWebhookEventType = "payment.succeeded" | "payment.failed";

/**
 * Payload normalizado de notificação de pagamento.
 */
export interface PaymentWebhookPayload {
  event: PaymentWebhookEventType;
  data: {
    transactionId: string;
    orderId: string;
    paidAt?: string;
    failureReason?: string;
  };
}

/**
 * Dados PIX expostos ao cliente para pagamento de pedido pendente.
 */
export interface PixPaymentDetails {
  orderId: string;
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: string;
  amountCents: number;
}

/**
 * Resultado de reembolso com contagem de ingressos e estoque restaurado.
 */
export interface RefundOrderResult {
  orderId: string;
  ticketsCancelled: number;
  stockRestored: number;
}

/**
 * Serviço central de pagamentos: cobrança PIX, webhooks e ciclo de vida do pedido.
 */
export class PaymentService {
  private readonly logger = Logger.getInstance();
  private readonly gateway: PaymentGateway;

  /**
   * @param dataSource - Conexão TypeORM.
   * @param redis - Cliente Redis opcional para caches de PIX/reserva.
   * @param gateway - Gateway injetável (padrão: factory por env).
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis?: Redis,
    gateway?: PaymentGateway,
  ) {
    this.gateway = gateway ?? createPaymentGateway();
  }

  /**
   * @returns Identificador do provedor ativo (`simulated` ou `mercadopago`).
   */
  getGatewayProvider(): PaymentGateway["provider"] {
    return this.gateway.provider;
  }

  /**
   * Marca pedido como falho quando a criação do PIX falha após persistência da reserva.
   * @param orderId - Pedido pendente.
   * @param reason - Motivo registrado no fluxo de falha.
   */
  async abortPendingOrderAfterPixCreationFailure(
    orderId: string,
    reason: string,
  ): Promise<void> {
    this.logger.error(CONTEXT, "Aborting order after PIX creation failure", {
      orderId,
      reason,
      gateway: this.gateway.provider,
    });

    await this.handlePaymentFailed({
      orderId,
      transactionId: "pix_creation_failed",
      failureReason: reason,
    });
  }

  /**
   * Cria cobrança PIX no gateway e persiste metadados no pedido e cache Redis.
   * @param orderId - Pedido em status pendente.
   * @returns Detalhes PIX para o cliente.
   * @throws {OrderNotFoundError} Se pedido ou usuário não existirem.
   * @throws {PaymentGatewayError} Em falha do provedor.
   */
  async processOrderPayment(orderId: string): Promise<PixPaymentDetails> {
    this.logger.info(CONTEXT, "Starting PIX charge creation", { orderId });

    const order = await findOneOrderByIdWithPaymentRelations(this.dataSource, orderId);

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
    order.pixCopyPaste = charge.pixCopyPaste;
    order.pixExpiresAt = charge.expiresAt;
    await updateOrder(this.dataSource, order);

    this.logger.info(CONTEXT, "PIX charge created", {
      orderId: order.id,
      transactionId: charge.transactionId,
      amountCents: order.totalPrice,
      expiresAt: charge.expiresAt.toISOString(),
    });

    const details = this.buildPixPaymentDetails(order, charge);

    if (this.redis) {
      await this.redis.setex(
        `${PAYMENT_CACHE_KEY_PREFIX}${order.reservationId}`,
        RESERVATION_TTL_SECONDS,
        JSON.stringify(details),
      );
    }

    return details;
  }

  /**
   * Resolve PIX a partir do pedido, cache Redis ou consulta ao Mercado Pago.
   * @param order - Entidade de pedido (idealmente com relações carregadas).
   * @returns Detalhes PIX ou `null` se o pedido não estiver pendente/sem PIX.
   */
  async resolvePixPaymentDetails(order: Order): Promise<PixPaymentDetails | null> {
    if (order.status !== OrderStatus.PENDING) {
      return null;
    }

    if (order.pixCopyPaste && order.pixExpiresAt) {
      return this.buildPixPaymentDetails(order, {
        transactionId: order.paymentGatewayId ?? "",
        pixCopyPaste: order.pixCopyPaste,
        expiresAt: order.pixExpiresAt,
      });
    }

    if (this.redis) {
      const cached = await this.redis.get(
        `${PAYMENT_CACHE_KEY_PREFIX}${order.reservationId}`,
      );

      if (cached) {
        const parsed = JSON.parse(cached) as PixPaymentDetails;
        await this.persistPixOnOrder(order.id, parsed);
        return parsed;
      }
    }

    if (order.paymentGatewayId && isMercadoPagoPixGateway(this.gateway)) {
      const recovered = await this.gateway.getPixCopyPaste(order.paymentGatewayId);

      if (recovered) {
        order.pixCopyPaste = recovered.pixCopyPaste;
        order.pixExpiresAt = recovered.expiresAt;
        await updateOrder(this.dataSource, order);

        return this.buildPixPaymentDetails(order, {
          transactionId: order.paymentGatewayId,
          pixCopyPaste: recovered.pixCopyPaste,
          expiresAt: recovered.expiresAt,
        });
      }
    }

    return null;
  }

  /**
   * @param orderId - Pedido do cliente.
   * @param userId - Dono autenticado.
   * @returns Detalhes PIX do pedido pendente.
   * @throws {OrderNotFoundError} Se pedido inexistente ou de outro usuário.
   * @throws {PaymentGatewayError} Com código `PIX_NOT_AVAILABLE` se não houver PIX.
   */
  async getOrderPixPayment(orderId: string, userId: string): Promise<PixPaymentDetails> {
    const order = await findOneOrderById(this.dataSource, orderId);

    if (!order || order.userId !== userId) {
      throw new OrderNotFoundError(orderId);
    }

    const details = await this.resolvePixPaymentDetails(order);

    if (!details) {
      throw new PaymentGatewayError(
        "PIX não disponível para este pedido",
        "PIX_NOT_AVAILABLE",
      );
    }

    return details;
  }

  private buildPixPaymentDetails(
    order: Order,
    charge: Pick<PixChargeResult, "transactionId" | "pixCopyPaste" | "expiresAt">,
  ): PixPaymentDetails {
    const expiresAt =
      charge.expiresAt instanceof Date
        ? charge.expiresAt.toISOString()
        : new Date(charge.expiresAt).toISOString();

    return {
      orderId: order.id,
      transactionId: charge.transactionId,
      pixCopyPaste: charge.pixCopyPaste,
      expiresAt,
      amountCents: order.totalPrice,
    };
  }

  private async persistPixOnOrder(
    orderId: string,
    details: PixPaymentDetails,
  ): Promise<void> {
    await updateOrderPixFields(this.dataSource, orderId, {
      pixCopyPaste: details.pixCopyPaste,
      pixExpiresAt: new Date(details.expiresAt),
    });
  }

  /**
   * Reembolsa pedido pago, cancela ingressos ativos e restaura estoque (DB + Redis).
   * @param orderId - Pedido em status `PAID`.
   * @returns Contagens de ingressos cancelados e unidades devolvidas ao lote.
   * @throws {OrderNotFoundError} Pedido inexistente.
   * @throws {OrderAlreadyRefundedError} Já reembolsado.
   * @throws {OrderRefundNotAllowedError} Status inválido ou ingresso já utilizado.
   * @throws {PaymentGatewayError} Falha no reembolso no provedor.
   */
  async refundOrder(orderId: string): Promise<RefundOrderResult> {
    this.logger.info(CONTEXT, "Starting order refund", { orderId });

    const order = await findOneOrderById(this.dataSource, orderId);

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

    const tickets = await findTicketsByOrderId(this.dataSource, orderId);

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

    const result = await refundOrderCommand(this.dataSource, orderId, this.redis);

    this.logger.info(CONTEXT, "Order refunded successfully", {
      orderId,
      ticketsCancelled: result.ticketsCancelled,
      stockRestored: result.stockRestored,
    });

    await this.clearPaymentCache(orderId);
    await this.clearReservationCache(orderId);

    return result;
  }

  /**
   * Simula pagamento aprovado em ambiente de desenvolvimento (gateway simulado).
   * @param orderId - Pedido pendente do solicitante.
   * @param requesterUserId - Usuário autenticado (deve ser o dono).
   * @throws {InvalidWebhookPayloadError} Em produção ou gateway não simulado.
   * @throws {OrderNotFoundError} Pedido inexistente ou de outro usuário.
   * @throws {PaymentAlreadyProcessedError} Pedido não pendente.
   */
  async simulateDevPayment(orderId: string, requesterUserId: string): Promise<void> {
    if (isProduction) {
      throw new InvalidWebhookPayloadError("Dev payment simulation is disabled in production");
    }

    if (env.payment.gateway !== "simulated") {
      throw new InvalidWebhookPayloadError(
        "Dev payment simulation requires PAYMENT_GATEWAY=simulated",
      );
    }

    const order = await findOneOrderById(this.dataSource, orderId);

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

  /**
   * Processa webhook interno de sucesso ou falha de pagamento.
   * @param payload - Evento e dados com `orderId` e `transactionId`.
   * @throws {InvalidWebhookPayloadError} Payload inválido.
   * @throws {OrderNotFoundError} Pedido não encontrado.
   * @throws {PaymentAlreadyProcessedError} Transição de estado inválida.
   */
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

  /**
   * Expira reserva pendente e pedido associado, restaurando estoque (TTL Redis).
   * @param reservationId - ID da reserva.
   * @returns `true` se houve expiração processada no banco.
   */
  async expireUnpaidOrderByReservationId(reservationId: string): Promise<boolean> {
    this.logger.info(CONTEXT, "Expiring unpaid order by reservation TTL", {
      reservationId,
    });

    const { expired, orderId } = await expireUnpaidOrderCommand(
      this.dataSource,
      reservationId,
      this.redis,
    );

    if (!expired) {
      this.logger.warn(
        CONTEXT,
        "Reservation not found or no longer pending on expiry",
        { reservationId },
      );
      return false;
    }

    this.logger.info(CONTEXT, "Unpaid order expired — stock restored", {
      reservationId,
      orderId,
    });

    if (orderId) {
      await this.clearReservationCache(orderId);
      await this.clearPaymentCache(orderId);
    }

    return true;
  }

  /**
   * Busca pagamento no MP e dispara webhook interno conforme status.
   * @param paymentId - ID numérico/string do pagamento Mercado Pago.
   * @returns `processed`, `pending` ou `ignored`.
   * @throws {InvalidWebhookPayloadError} Se o gateway ativo não for Mercado Pago.
   */
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

    try {
      const result = await processPaymentSucceeded(this.dataSource, {
        orderId: data.orderId,
        transactionId: data.transactionId,
      });

      this.logger.info(CONTEXT, "Payment succeeded — tickets issued", {
        orderId: result.orderId,
        reservationId: result.reservationId,
        transactionId: result.transactionId,
        ticketsCreated: result.ticketsCreated,
        ticketIds: result.ticketIds,
      });
    } catch (error) {
      if (error instanceof PaymentAlreadyProcessedError) {
        this.logger.warn(CONTEXT, "Payment success ignored — already processed", {
          orderId: data.orderId,
        });
      }
      throw error;
    }

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

    const result = await processPaymentFailed(
      this.dataSource,
      {
        orderId: data.orderId,
        transactionId: data.transactionId,
      },
      this.redis,
    );

    if (result.status === "already_failed") {
      this.logger.info(CONTEXT, "Payment failure ignored — order already failed", {
        orderId: data.orderId,
      });
      return;
    }

    if (result.status === "reservation_not_restored") {
      this.logger.info(CONTEXT, "Payment failed — reservation not restored", {
        orderId: data.orderId,
      });
    } else if (result.status === "processed") {
      this.logger.info(CONTEXT, "Payment failed — stock restored to lot", {
        orderId: data.orderId,
        ticketLotId: result.ticketLotId,
        quantityRestored: result.stockRestored,
      });
    }

    await this.clearReservationCache(data.orderId);
    await this.clearPaymentCache(data.orderId);
  }

  private async clearReservationCache(orderId: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    const order = await findOneOrderReservationIdById(this.dataSource, orderId);

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

    const order = await findOneOrderReservationIdById(this.dataSource, orderId);

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
