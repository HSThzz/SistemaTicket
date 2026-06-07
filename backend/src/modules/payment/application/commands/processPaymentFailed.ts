/**
 * @file Command: processa falha de pagamento e restaura estoque em transação.
 * @module modules/payment/application/commands/processPaymentFailed
 */

import type Redis from "ioredis";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { OrderStatus, ReservationStatus } from "../../../../shared/kernel/enums";
import {
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
} from "../../domain/errors/PaymentError";

export interface ProcessPaymentFailedData {
  orderId: string;
  transactionId: string;
}

export type ProcessPaymentFailedResult =
  | { status: "processed"; stockRestored: number; ticketLotId: string | null }
  | { status: "already_failed" }
  | { status: "already_paid" }
  | { status: "reservation_not_restored" };

export async function processPaymentFailed(
  data: ProcessPaymentFailedData,
  redis?: Redis,
): Promise<ProcessPaymentFailedResult> {
  return AppDataSource.transaction(async (manager) => {
    const order = await manager.findOne(Order, {
      where: { id: data.orderId },
      lock: { mode: "pessimistic_write" },
    });

    if (!order) {
      throw new OrderNotFoundError(data.orderId);
    }

    if (order.status === OrderStatus.FAILED) {
      return { status: "already_failed" };
    }

    if (order.status === OrderStatus.PAID) {
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
      return { status: "reservation_not_restored" };
    }

    reservation.status = ReservationStatus.EXPIRED;
    await manager.save(reservation);

    const ticketLot = await manager.findOne(TicketLot, {
      where: { id: reservation.ticketLotId },
      lock: { mode: "pessimistic_write" },
    });

    if (!ticketLot) {
      return {
        status: "processed",
        stockRestored: 0,
        ticketLotId: null,
      };
    }

    ticketLot.availableQuantity += reservation.quantity;
    await manager.save(ticketLot);

    if (redis) {
      const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLot.id}`;
      await redis.incrby(stockKey, reservation.quantity);
    }

    return {
      status: "processed",
      stockRestored: reservation.quantity,
      ticketLotId: ticketLot.id,
    };
  });
}


