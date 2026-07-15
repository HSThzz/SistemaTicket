/**
 * @file Query: verifica se o usuário tem pedido com pagamento pendente.
 * @module modules/sales/application/queries/findPendingOrderByUserId
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { OrderStatus } from "../../../../shared/kernel/enums";

/**
 * Retorna o ID de um pedido PENDING do usuário, se existir.
 */
export async function findPendingOrderByUserId(
  userId: string,
): Promise<{ id: string } | null> {
  return AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .select(["order.id"])
    .where("order.userId = :userId", { userId })
    .andWhere("order.status = :status", { status: OrderStatus.PENDING })
    .getOne();
}
