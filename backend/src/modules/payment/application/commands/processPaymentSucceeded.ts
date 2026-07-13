/**
 * @file Command: processa pagamento aprovado e emite ingressos em transação.
 * @module modules/payment/application/commands/processPaymentSucceeded
 */

import { randomBytes } from "node:crypto";
import type Redis from "ioredis";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import {
  OrderStatus,
  ReservationStatus,
  TicketStatus,
} from "../../../../shared/kernel/enums";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { generateTicketCheckInCode } from "../../../../shared/kernel/ticketCheckInCode";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
} from "../../domain/errors/PaymentError";

const CONTEXT = "processPaymentSucceeded";

export type ProcessPaymentSucceededData = Prettify<
  Pick<Order, "id"> & {
    paymentGatewayId: NonNullable<Order["paymentGatewayId"]>;
  }
>;

export type ProcessPaymentSucceededResult = Prettify<
  Pick<Order, "id" | "reservationId"> & {
    paymentGatewayId: NonNullable<Order["paymentGatewayId"]>;
    ticketsCreated: number;
    ticketIds: Ticket["id"][];
    recoveredFromExpired: boolean;
  }
>;

type CreateTicketData = Prettify<
  Pick<
    Ticket,
    | "orderId"
    | "ticketLotId"
    | "ownerName"
    | "ownerDocument"
    | "uniqueCode"
    | "checkInCode"
    | "status"
  >
>;

/**
 * Confirma pagamento e emite ingressos.
 * Recupera pedidos `FAILED` com reserva `EXPIRED` (race TTL × webhook aprovado).
 */
export async function processPaymentSucceeded(
  data: ProcessPaymentSucceededData,
  redis?: Redis,
): Promise<ProcessPaymentSucceededResult> {
  return AppDataSource.transaction(async (manager) => {
    const order = await manager.findOne(Order, {
      where: { id: data.id },
      lock: { mode: "pessimistic_write" },
    });

    if (!order) {
      throw new OrderNotFoundError(data.id);
    }

    if (order.status === OrderStatus.PAID) {
      throw new PaymentAlreadyProcessedError(order.id, order.status);
    }

    if (order.status === OrderStatus.REFUNDED) {
      throw new PaymentAlreadyProcessedError(order.id, order.status);
    }

    const reservation = await manager.findOne(Reservation, {
      where: { id: order.reservationId },
      lock: { mode: "pessimistic_write" },
    });

    if (!reservation) {
      throw new OrderNotFoundError(data.id);
    }

    const existingTickets = await manager.find(Ticket, {
      where: { orderId: order.id },
    });

    if (existingTickets.length > 0 && order.status === OrderStatus.PENDING) {
      // Estado inconsistente: ingressos sem PAID — corrige status.
      order.status = OrderStatus.PAID;
      order.paymentGatewayId = data.paymentGatewayId;
      await manager.save(order);
      reservation.status = ReservationStatus.COMPLETED;
      await manager.save(reservation);

      return {
        id: order.id,
        reservationId: reservation.id,
        paymentGatewayId: data.paymentGatewayId,
        ticketsCreated: 0,
        ticketIds: existingTickets.map((ticket) => ticket.id),
        recoveredFromExpired: false,
      };
    }

    let recoveredFromExpired = false;

    if (order.status === OrderStatus.FAILED) {
      if (
        reservation.status !== ReservationStatus.EXPIRED &&
        reservation.status !== ReservationStatus.PENDING
      ) {
        throw new PaymentAlreadyProcessedError(order.id, reservation.status);
      }

      if (reservation.status === ReservationStatus.EXPIRED) {
        const ticketLot = await manager.findOne(TicketLot, {
          where: { id: reservation.ticketLotId },
          lock: { mode: "pessimistic_write" },
        });

        if (!ticketLot) {
          throw new OrderNotFoundError(data.id);
        }

        ticketLot.availableQuantity -= reservation.quantity;

        if (ticketLot.availableQuantity < 0) {
          Logger.getInstance().error(
            CONTEXT,
            "Payment recovery oversold lot — proceeding to honor paid order",
            {
              orderId: order.id,
              ticketLotId: ticketLot.id,
              availableQuantity: ticketLot.availableQuantity,
              quantity: reservation.quantity,
            },
          );
        }

        await manager.save(ticketLot);

        if (redis) {
          await redis.incrby(
            `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLot.id}`,
            -reservation.quantity,
          );
        }

        recoveredFromExpired = true;
      }
    } else if (order.status !== OrderStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(order.id, order.status);
    } else if (reservation.status !== ReservationStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(order.id, reservation.status);
    }

    const user = await manager.findOne(User, {
      where: { id: order.userId },
    });

    if (!user) {
      throw new OrderNotFoundError(data.id);
    }

    order.status = OrderStatus.PAID;
    order.paymentGatewayId = data.paymentGatewayId;
    await manager.save(order);

    reservation.status = ReservationStatus.COMPLETED;
    await manager.save(reservation);

    if (existingTickets.length > 0) {
      return {
        id: order.id,
        reservationId: reservation.id,
        paymentGatewayId: data.paymentGatewayId,
        ticketsCreated: 0,
        ticketIds: existingTickets.map((ticket) => ticket.id),
        recoveredFromExpired,
      };
    }

    const ticketsData: CreateTicketData[] = Array.from(
      { length: reservation.quantity },
      () => ({
        orderId: order.id,
        ticketLotId: reservation.ticketLotId,
        ownerName: user.name,
        ownerDocument: user.document,
        uniqueCode: randomBytes(32).toString("hex"),
        checkInCode: generateTicketCheckInCode(),
        status: TicketStatus.ACTIVE,
      }),
    );

    const insertResult = await manager.insert(Ticket, ticketsData);
    const ticketIds = insertResult.identifiers.map(
      (identifier) => identifier.id as string,
    );

    if (recoveredFromExpired) {
      Logger.getInstance().warn(CONTEXT, "Recovered paid order after expiry race", {
        orderId: order.id,
        reservationId: reservation.id,
        ticketsCreated: ticketsData.length,
      });
    }

    return {
      id: order.id,
      reservationId: reservation.id,
      paymentGatewayId: data.paymentGatewayId,
      ticketsCreated: ticketsData.length,
      ticketIds,
      recoveredFromExpired,
    };
  });
}
