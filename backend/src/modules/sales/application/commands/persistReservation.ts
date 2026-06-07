/**
 * @file Command: persiste reserva, pedido e decrementa estoque do lote em transação.
 * @module modules/sales/application/commands/persistReservation
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { OrderStatus, ReservationStatus } from "../../../../shared/kernel/enums";

export interface PersistReservationPayload {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
  expiresAt: string;
}

export type PersistReservationResult =
  | { status: "created"; orderId: string }
  | { status: "duplicate"; orderId: string | null }
  | { status: "lot_not_found" }
  | { status: "negative_stock" };

export async function persistReservation(
  dataSource: DataSource,
  payload: PersistReservationPayload,
): Promise<PersistReservationResult> {
  return dataSource.transaction(async (manager) => {
    const existing = await manager.findOne(Reservation, {
      where: { id: payload.reservationId },
    });

    if (existing) {
      const existingOrder = await manager.findOne(Order, {
        where: { reservationId: payload.reservationId },
      });
      return { status: "duplicate", orderId: existingOrder?.id ?? null };
    }

    const lot = await manager.findOne(TicketLot, {
      where: { id: payload.ticketLotId },
      lock: { mode: "pessimistic_write" },
    });

    if (!lot) {
      return { status: "lot_not_found" };
    }

    lot.availableQuantity -= payload.quantity;
    if (lot.availableQuantity < 0) {
      return { status: "negative_stock" };
    }

    await manager.save(lot);

    const reservation = manager.create(Reservation, {
      id: payload.reservationId,
      userId: payload.userId,
      ticketLotId: payload.ticketLotId,
      quantity: payload.quantity,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(payload.expiresAt),
    });
    await manager.save(reservation);

    const order = manager.create(Order, {
      userId: payload.userId,
      reservationId: payload.reservationId,
      totalPrice: lot.price * payload.quantity,
      status: OrderStatus.PENDING,
      paymentGatewayId: null,
    });
    await manager.save(order);

    return { status: "created", orderId: order.id };
  });
}
