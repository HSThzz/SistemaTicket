/**
 * @file Query: busca reserva por ID com lote.
 * @module modules/sales/application/queries/findOneReservationById
 */

import type { DataSource } from "typeorm";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";

export async function findOneReservationById(
  dataSource: DataSource,
  reservationId: string,
): Promise<Reservation | null> {
  return dataSource.getRepository(Reservation).findOne({
    where: { id: reservationId },
    relations: { ticketLot: true },
  });
}
