/**
 * @file Query: quantidade já comprometida do usuário neste lote (ingressos + reservas).
 * @module modules/sales/application/queries/countUserHeldQuantityForLot
 */

import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import {
  ReservationStatus,
  TicketStatus,
} from "../../../../shared/kernel/enums";

/**
 * Soma ingressos ACTIVE/USED e reservas PENDING não expiradas do usuário no lote.
 */
export async function countUserHeldQuantityForLot(
  userId: string,
  ticketLotId: string,
): Promise<number> {
  const ticketCount = await AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .innerJoin("ticket.order", "ord")
    .where("ticket.ticketLotId = :ticketLotId", { ticketLotId })
    .andWhere("ord.userId = :userId", { userId })
    .andWhere("ticket.status IN (:...statuses)", {
      statuses: [TicketStatus.ACTIVE, TicketStatus.USED],
    })
    .getCount();

  const reservationRow = await AppDataSource.getRepository(Reservation)
    .createQueryBuilder("reservation")
    .select("COALESCE(SUM(reservation.quantity), 0)", "total")
    .where("reservation.ticketLotId = :ticketLotId", { ticketLotId })
    .andWhere("reservation.userId = :userId", { userId })
    .andWhere("reservation.status = :status", {
      status: ReservationStatus.PENDING,
    })
    .andWhere("reservation.expiresAt > :now", { now: new Date() })
    .getRawOne<{ total: string }>();

  return ticketCount + Number(reservationRow?.total ?? 0);
}
