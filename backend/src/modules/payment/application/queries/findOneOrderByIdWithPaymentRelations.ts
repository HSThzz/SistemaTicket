/**
 * @file Query: busca pedido por ID com reserva, lote e usuário para cobrança PIX.
 * @module modules/payment/application/queries/findOneOrderByIdWithPaymentRelations
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneOrderByIdWithPaymentRelations(orderId: string,
): Promise<Order | null> {
  return AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.reservation", "reservation")
    .leftJoinAndSelect("reservation.ticketLot", "ticketLot")
    .leftJoinAndSelect("order.user", "user")
    .where("order.id = :orderId", { orderId })
    .getOne();
}


