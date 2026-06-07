/**
 * @file Query: busca pedido por ID com reserva, lote e usuário para cobrança PIX.
 * @module modules/payment/application/queries/findOneOrderByIdWithPaymentRelations
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export async function findOneOrderByIdWithPaymentRelations(
  dataSource: DataSource,
  orderId: string,
): Promise<Order | null> {
  return dataSource.getRepository(Order).findOne({
    where: { id: orderId },
    relations: { reservation: { ticketLot: true }, user: true },
  });
}
