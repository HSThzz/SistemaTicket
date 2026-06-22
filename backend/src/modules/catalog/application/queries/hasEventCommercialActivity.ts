/**
 * @file Query: verifica atividade comercial no evento (pedidos, reservas, ingressos).
 * @module modules/catalog/application/queries/hasEventCommercialActivity
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { OrderStatus, ReservationStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

/**
 * Indica se o evento já teve reservas ativas, pedidos ou ingressos emitidos.
 */
export async function hasEventCommercialActivity(
  eventId: string,
): Promise<boolean> {
  const ticketCount = await AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .innerJoin("ticket.ticketLot", "lot")
    .where("lot.event_id = :eventId", { eventId })
    .getCount();

  if (ticketCount > 0) {
    return true;
  }

  const orderCount = await AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .innerJoin("order.reservation", "reservation")
    .innerJoin("reservation.ticketLot", "lot")
    .where("lot.event_id = :eventId", { eventId })
    .andWhere("order.status IN (:...statuses)", {
      statuses: [OrderStatus.PAID, OrderStatus.PENDING],
    })
    .getCount();

  if (orderCount > 0) {
    return true;
  }

  const reservationCount = await AppDataSource.getRepository(Reservation)
    .createQueryBuilder("reservation")
    .innerJoin("reservation.ticketLot", "lot")
    .where("lot.event_id = :eventId", { eventId })
    .andWhere("reservation.status = :status", {
      status: ReservationStatus.PENDING,
    })
    .getCount();

  return reservationCount > 0;
}
