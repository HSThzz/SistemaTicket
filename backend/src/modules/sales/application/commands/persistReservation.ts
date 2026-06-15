/**
 * @file Command: persiste reserva, pedido e decrementa estoque do lote em transação.
 * @module modules/sales/application/commands/persistReservation
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { OrderStatus, ReservationStatus } from "../../../../shared/kernel/enums";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type PersistReservationPayload = Prettify<
  Pick<Reservation, "userId" | "ticketLotId" | "quantity"> & {
    reservationId: Reservation["id"];
    expiresAt: string;
  }
>;

type CreateReservationData = Prettify<
  Pick<
    Reservation,
    "id" | "userId" | "ticketLotId" | "quantity" | "status" | "expiresAt"
  >
>;

type CreateOrderData = Prettify<
  Pick<Order, "userId" | "reservationId" | "totalPrice" | "status" | "paymentGatewayId">
>;

export type PersistReservationResult =
  | Prettify<{ status: "created"; orderId: Order["id"] }>
  | Prettify<{ status: "duplicate"; orderId: Order["id"] | null }>
  | { status: "lot_not_found" }
  | { status: "user_not_found" }
  | { status: "negative_stock" };

export async function persistReservation(payload: PersistReservationPayload,
): Promise<PersistReservationResult> {
  return AppDataSource.transaction(async (manager) => {
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

    const user = await manager.findOne(User, {
      where: { id: payload.userId },
    });

    if (!user) {
      return { status: "user_not_found" };
    }

    lot.availableQuantity -= payload.quantity;
    if (lot.availableQuantity < 0) {
      return { status: "negative_stock" };
    }

    await manager.save(lot);

    const reservationData: CreateReservationData = {
      id: payload.reservationId,
      userId: payload.userId,
      ticketLotId: payload.ticketLotId,
      quantity: payload.quantity,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(payload.expiresAt),
    };
    const reservation = manager.create(Reservation, reservationData);
    await manager.save(reservation);

    const orderData: CreateOrderData = {
      userId: payload.userId,
      reservationId: payload.reservationId,
      totalPrice: lot.price * payload.quantity,
      status: OrderStatus.PENDING,
      paymentGatewayId: null,
    };
    const order = manager.create(Order, orderData);
    await manager.save(order);

    return { status: "created", orderId: order.id };
  });
}
