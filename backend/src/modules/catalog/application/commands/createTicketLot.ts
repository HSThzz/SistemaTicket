/**
 * @file Command: persiste novo lote de ingressos.
 * @module modules/catalog/application/commands/createTicketLot
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type CreateTicketLotData = Prettify<
  Pick<
    TicketLot,
    "eventId" | "name" | "price" | "totalQuantity" | "availableQuantity"
  >
>;

export async function createTicketLot(data: CreateTicketLotData,
): Promise<TicketLot> {
  const repository = AppDataSource.getRepository(TicketLot);
  const lot = repository.create(data);
  return repository.save(lot);
}
