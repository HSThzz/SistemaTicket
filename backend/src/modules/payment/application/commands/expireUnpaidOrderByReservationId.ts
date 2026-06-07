/**
 * @file Command: expira reserva pendente e restaura estoque em transação.
 * @module modules/payment/application/commands/expireUnpaidOrderByReservationId
 */

import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { OrderStatus, ReservationStatus } from "../../../../shared/kernel/enums";

export interface ExpireUnpaidOrderResult {
  expired: boolean;
  orderId: string | null;
}

export async function expireUnpaidOrderByReservationId(
  dataSource: DataSource,
  reservationId: string,
  redis?: Redis,
): Promise<ExpireUnpaidOrderResult> {
  return dataSource.transaction(async (manager) => {
    const reservation = await manager.findOne(Reservation, {
      where: { id: reservationId },
      lock: { mode: "pessimistic_write" },
    });

    if (!reservation) {
      return { expired: false, orderId: null };
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      return { expired: false, orderId: null };
    }

    let orderId: string | null = null;

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

    if (ticketLot) {
      ticketLot.availableQuantity += reservation.quantity;
      await manager.save(ticketLot);

      if (redis) {
        const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLot.id}`;
        await redis.incrby(stockKey, reservation.quantity);
      }
    }

    return { expired: true, orderId };
  });
}
