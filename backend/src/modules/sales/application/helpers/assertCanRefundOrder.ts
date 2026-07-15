/**
 * @file Autorização para reembolsar um pedido (admin ou produtor do evento).
 * @module modules/sales/application/helpers/assertCanRefundOrder
 */

import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { UserRole } from "../../../../shared/kernel/enums";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import { ForbiddenError } from "../../../identity/domain/errors/AuthError";
import { OrderNotFoundError } from "../../../payment/domain/errors/PaymentError";

export type RefundActor = {
  userId: string;
  role: UserRole;
};

/**
 * Admin/staff pode reembolsar qualquer pedido.
 * Produtor só reembolsa pedidos de eventos em que é `producerId`.
 */
export async function assertCanRefundOrder(
  orderId: string,
  actor: RefundActor,
): Promise<Order> {
  const order = await AppDataSource.getRepository(Order).findOne({
    where: { id: orderId },
    relations: {
      reservation: {
        ticketLot: {
          event: true,
        },
      },
    },
  });

  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  if (isStaffRole(actor.role)) {
    return order;
  }

  if (actor.role !== UserRole.PRODUCER) {
    throw new ForbiddenError();
  }

  const producerId = order.reservation?.ticketLot?.event?.producerId;

  if (!producerId || producerId !== actor.userId) {
    throw new ForbiddenError();
  }

  return order;
}
