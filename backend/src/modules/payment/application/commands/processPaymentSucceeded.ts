/**
 * @file Command: processa pagamento aprovado e emite ingressos em transação.
 * @module modules/payment/application/commands/processPaymentSucceeded
 */

import { randomBytes } from "node:crypto";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import {
  OrderStatus,
  ReservationStatus,
  TicketStatus,
} from "../../../../shared/kernel/enums";
import type { Prettify } from "../../../../shared/kernel/prettify";
import {
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
} from "../../domain/errors/PaymentError";

export type ProcessPaymentSucceededData = Prettify<
  Pick<Order, "id"> & {
    paymentGatewayId: NonNullable<Order["paymentGatewayId"]>;
  }
>;

export type ProcessPaymentSucceededResult = Prettify<
  Pick<Order, "id" | "reservationId"> & {
    paymentGatewayId: NonNullable<Order["paymentGatewayId"]>;
    ticketsCreated: number;
    ticketIds: Ticket["id"][];
  }
>;

type CreateTicketData = Prettify<
  Pick<
    Ticket,
    "orderId" | "ticketLotId" | "ownerName" | "ownerDocument" | "uniqueCode" | "status"
  >
>;

export async function processPaymentSucceeded(
  data: ProcessPaymentSucceededData,
): Promise<ProcessPaymentSucceededResult> {
  return AppDataSource.transaction(async (manager) => {
    const order = await manager.findOne(Order, {
      where: { id: data.id },
      lock: { mode: "pessimistic_write" },
    });

    if (!order) {
      throw new OrderNotFoundError(data.id);
    }

    if (order.status === OrderStatus.PAID) {
      throw new PaymentAlreadyProcessedError(order.id, order.status);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(order.id, order.status);
    }

    const reservation = await manager.findOne(Reservation, {
      where: { id: order.reservationId },
      lock: { mode: "pessimistic_write" },
    });

    if (!reservation) {
      throw new OrderNotFoundError(data.id);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(order.id, reservation.status);
    }

    const user = await manager.findOne(User, {
      where: { id: order.userId },
    });

    if (!user) {
      throw new OrderNotFoundError(data.id);
    }

    order.status = OrderStatus.PAID;
    order.paymentGatewayId = data.paymentGatewayId;
    await manager.save(order);

    reservation.status = ReservationStatus.COMPLETED;
    await manager.save(reservation);

    const tickets: Ticket[] = [];

    for (let index = 0; index < reservation.quantity; index += 1) {
      const ticketData: CreateTicketData = {
        orderId: order.id,
        ticketLotId: reservation.ticketLotId,
        ownerName: user.name,
        ownerDocument: user.document,
        uniqueCode: randomBytes(32).toString("hex"),
        status: TicketStatus.ACTIVE,
      };
      const ticket = manager.create(Ticket, ticketData);

      tickets.push(await manager.save(ticket));
    }

    return {
      id: order.id,
      reservationId: reservation.id,
      paymentGatewayId: data.paymentGatewayId,
      ticketsCreated: tickets.length,
      ticketIds: tickets.map((ticket) => ticket.id),
    };
  });
}
