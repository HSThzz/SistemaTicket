/**
 * @file Command: persiste novo lote de ingressos.
 * @module modules/catalog/application/commands/createTicketLot
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export interface CreateTicketLotData {
  eventId: string;
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
}

export async function createTicketLot(data: CreateTicketLotData,
): Promise<TicketLot> {
  const repository = AppDataSource.getRepository(TicketLot);
  const lot = repository.create(data);
  return repository.save(lot);
}


