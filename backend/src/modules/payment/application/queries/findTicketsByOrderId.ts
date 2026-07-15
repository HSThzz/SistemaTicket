/**
 * @file Query: lista ingressos de um pedido.
 * @module modules/payment/application/queries/findTicketsByOrderId
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findTicketsByOrderId(orderId: string,
): Promise<Ticket[]> {
  return AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .where("ticket.orderId = :orderId", { orderId })
    .getMany();
}


