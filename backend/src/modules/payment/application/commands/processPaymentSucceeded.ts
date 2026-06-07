/**
 * @file Command: processa pagamento aprovado e emite ingressos em transação.
 * @module modules/payment/application/commands/processPaymentSucceeded
 */

import { randomBytes } from "node:crypto";
import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import {
  OrderStatus,
  ReservationStatus,
  TicketStatus,
} from "../../../../shared/kernel/enums";
import {
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
} from "../../domain/errors/PaymentError";

export interface ProcessPaymentSucceededData {
  orderId: string;
  transactionId: string;
}

export interface ProcessPaymentSucceededResult {
  orderId: string;
  reservationId: string;
  transactionId: string;
  ticketsCreated: number;
  ticketIds: string[];
}

export async function processPaymentSucceeded(
  dataSource: DataSource,
  data: ProcessPaymentSucceededData,
): Promise<ProcessPaymentSucceededResult> {
  return dataSource.transaction(async (manager) => {
    const order = await manager.findOne(Order, {
      where: { id: data.orderId },
      lock: { mode: "pessimistic_write" },
    });

    if (!order) {
      throw new OrderNotFoundError(data.orderId);
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
      throw new OrderNotFoundError(data.orderId);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(order.id, reservation.status);
    }

    const user = await manager.findOne(User, {
      where: { id: order.userId },
    });

    if (!user) {
      throw new OrderNotFoundError(data.orderId);
    }

    order.status = OrderStatus.PAID;
    order.paymentGatewayId = data.transactionId;
    await manager.save(order);

    reservation.status = ReservationStatus.COMPLETED;
    await manager.save(reservation);

    const tickets: Ticket[] = [];

    for (let index = 0; index < reservation.quantity; index += 1) {
      const ticket = manager.create(Ticket, {
        orderId: order.id,
        ticketLotId: reservation.ticketLotId,
        ownerName: user.name,
        ownerDocument: user.document,
        uniqueCode: randomBytes(32).toString("hex"),
        status: TicketStatus.ACTIVE,
      });

      tickets.push(await manager.save(ticket));
    }

    return {
      orderId: order.id,
      reservationId: reservation.id,
      transactionId: data.transactionId,
      ticketsCreated: tickets.length,
      ticketIds: tickets.map((ticket) => ticket.id),
    };
  });
}
