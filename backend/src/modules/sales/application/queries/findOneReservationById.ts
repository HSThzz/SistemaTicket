/**
 * @file Query: busca reserva por ID com lote.
 * @module modules/sales/application/queries/findOneReservationById
 */

import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneReservationById(reservationId: string,
): Promise<Reservation | null> {
  return AppDataSource.getRepository(Reservation)
    .createQueryBuilder("reservation")
    .leftJoinAndSelect("reservation.ticketLot", "ticketLot")
    .where("reservation.id = :reservationId", { reservationId })
    .getOne();
}


