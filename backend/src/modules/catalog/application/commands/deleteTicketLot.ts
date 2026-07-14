/**
 * @file Command: remove lote de ingressos.
 * @module modules/catalog/application/commands/deleteTicketLot
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function deleteTicketLot(lot: TicketLot): Promise<void> {
  await AppDataSource.getRepository(TicketLot).remove(lot);
}
