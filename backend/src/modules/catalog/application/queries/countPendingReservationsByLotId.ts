/**
 * @file Query: conta reservas pendentes de um lote.
 * @module modules/catalog/application/queries/countPendingReservationsByLotId
 */

import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { ReservationStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function countPendingReservationsByLotId(
  lotId: string,
): Promise<number> {
  return AppDataSource.getRepository(Reservation).count({
    where: {
      ticketLotId: lotId,
      status: ReservationStatus.PENDING,
    },
  });
}
