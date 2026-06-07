/**
 * @file Command: reembolsa pedido, cancela ingressos e restaura estoque em transação.
 * @module modules/payment/application/commands/refundOrder
 */

import type Redis from "ioredis";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { OrderStatus, TicketStatus } from "../../../../shared/kernel/enums";
import type { Prettify } from "../../../../shared/kernel/prettify";
import {
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
} from "../../domain/errors/PaymentError";

export type RefundOrderResult = Prettify<{
  orderId: Order["id"];
  ticketsCancelled: number;
  stockRestored: number;
}>;

type CancelTicketChanges = Prettify<Pick<Ticket, "status">>;

export async function refundOrder(
  orderId: string,
  redis?: Redis,
): Promise<RefundOrderResult> {
  return AppDataSource.transaction(async (manager) => {
    const lockedOrder = await manager.findOne(Order, {
      where: { id: orderId },
      lock: { mode: "pessimistic_write" },
    });

    if (!lockedOrder) {
      throw new OrderNotFoundError(orderId);
    }

    if (lockedOrder.status === OrderStatus.REFUNDED) {
      throw new OrderAlreadyRefundedError(orderId);
    }

    if (lockedOrder.status !== OrderStatus.PAID) {
      throw new OrderRefundNotAllowedError(
        `Order ${orderId} with status ${lockedOrder.status} cannot be refunded`,
      );
    }

    const orderTickets = await manager.find(Ticket, {
      where: { orderId },
      lock: { mode: "pessimistic_write" },
    });

    const activeTickets = orderTickets.filter(
      (ticket) => ticket.status === TicketStatus.ACTIVE,
    );

    const checkedIn = orderTickets.some(
      (ticket) =>
        ticket.status === TicketStatus.USED || ticket.checkedInAt !== null,
    );

    if (checkedIn) {
      throw new OrderRefundNotAllowedError(
        `Order ${orderId} has checked-in tickets and cannot be refunded`,
        "TICKET_ALREADY_USED",
      );
    }

    const cancelChanges: CancelTicketChanges = { status: TicketStatus.CANCELLED };

    for (const ticket of activeTickets) {
      Object.assign(ticket, cancelChanges);
      await manager.save(ticket);
    }

    const stockByLot = new Map<string, number>();
    for (const ticket of activeTickets) {
      stockByLot.set(
        ticket.ticketLotId,
        (stockByLot.get(ticket.ticketLotId) ?? 0) + 1,
      );
    }

    let stockRestored = 0;

    for (const [ticketLotId, quantity] of stockByLot) {
      const ticketLot = await manager.findOne(TicketLot, {
        where: { id: ticketLotId },
        lock: { mode: "pessimistic_write" },
      });

      if (!ticketLot) {
        continue;
      }

      ticketLot.availableQuantity += quantity;
      await manager.save(ticketLot);
      stockRestored += quantity;

      if (redis) {
        await redis.incrby(
          `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLotId}`,
          quantity,
        );
      }
    }

    lockedOrder.status = OrderStatus.REFUNDED;
    await manager.save(lockedOrder);

    return {
      orderId,
      ticketsCancelled: activeTickets.length,
      stockRestored,
    };
  });
}
