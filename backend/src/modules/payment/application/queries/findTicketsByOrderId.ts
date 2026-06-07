/**
 * @file Query: lista ingressos de um pedido.
 * @module modules/payment/application/queries/findTicketsByOrderId
 */

import type { DataSource } from "typeorm";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";

export async function findTicketsByOrderId(
  dataSource: DataSource,
  orderId: string,
): Promise<Ticket[]> {
  return dataSource.getRepository(Ticket).find({
    where: { orderId },
  });
}
