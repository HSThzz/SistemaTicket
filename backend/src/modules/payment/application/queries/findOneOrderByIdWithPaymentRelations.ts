/**
 * @file Query: busca pedido por ID com reserva, lote e usuário para cobrança PIX.
 * @module modules/payment/application/queries/findOneOrderByIdWithPaymentRelations
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneOrderByIdWithPaymentRelations(orderId: string,
): Promise<Order | null> {
  return AppDataSource.getRepository(Order).findOne({
    where: { id: orderId },
    relations: { reservation: { ticketLot: true }, user: true },
  });
}


