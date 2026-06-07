/**
 * @file Command: persiste novo lote de ingressos.
 * @module modules/catalog/application/commands/createTicketLot
 */

import type { DataSource } from "typeorm";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";

export interface CreateTicketLotData {
  eventId: string;
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
}

export async function createTicketLot(
  dataSource: DataSource,
  data: CreateTicketLotData,
): Promise<TicketLot> {
  const repository = dataSource.getRepository(TicketLot);
  const lot = repository.create(data);
  return repository.save(lot);
}
