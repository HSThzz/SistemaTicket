/**
 * @file Command: emite ingressos manualmente (cortesia/offline) em transação única.
 * @module modules/ticketing/application/commands/issueManualTickets
 */

import { randomBytes, randomUUID } from "node:crypto";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { getRedis } from "../../../../shared/infrastructure/config/redis";
import { isUniqueViolation } from "../../../../shared/infrastructure/persistence/isUniqueViolation";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import {
  EventStatus,
  OrderStatus,
  ReservationStatus,
  TicketStatus,
} from "../../../../shared/kernel/enums";
import { generateTicketCheckInCode } from "../../../../shared/kernel/ticketCheckInCode";
import {
  ManualTicketEventNotIssuableError,
  ManualTicketInsufficientStockError,
  ManualTicketLotNotFoundError,
  ManualTicketUserNotFoundError,
} from "../../domain/errors/ManualTicketError";

const CONTEXT = "IssueManualTickets";
const logger = Logger.getInstance();
const CODE_INSERT_MAX_ATTEMPTS = 5;

const ISSUABLE_EVENT_STATUSES = new Set<EventStatus>([
  EventStatus.PUBLISHED,
  EventStatus.FINISHED,
]);

export interface IssueManualTicketsInput {
  userId: string;
  ticketLotId: string;
  quantity: number;
}

export interface IssueManualTicketsResult {
  orderId: string;
  reservationId: string;
  ticketIds: string[];
  ticketsIssued: number;
  eventId: string;
  eventTitle: string;
  lotName: string;
  userEmail: string;
  userName: string;
  availableQuantityAfter: number;
}

export async function issueManualTickets(
  input: IssueManualTicketsInput,
): Promise<IssueManualTicketsResult> {
  const reservationId = randomUUID();
  const paymentGatewayId = `manual:${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const result = await AppDataSource.transaction(async (manager) => {
    const user = await manager.findOne(User, {
      where: { id: input.userId },
    });

    if (!user) {
      throw new ManualTicketUserNotFoundError(input.userId);
    }

    const lot = await manager.findOne(TicketLot, {
      where: { id: input.ticketLotId },
      lock: { mode: "pessimistic_write" },
    });

    if (!lot) {
      throw new ManualTicketLotNotFoundError(input.ticketLotId);
    }

    const event = await manager.findOne(Event, {
      where: { id: lot.eventId },
    });

    if (!event || event.deletedAt) {
      throw new ManualTicketLotNotFoundError(input.ticketLotId);
    }

    if (!ISSUABLE_EVENT_STATUSES.has(event.status)) {
      throw new ManualTicketEventNotIssuableError(event.status);
    }

    if (lot.availableQuantity < input.quantity) {
      throw new ManualTicketInsufficientStockError(lot.availableQuantity);
    }

    lot.availableQuantity -= input.quantity;
    await manager.save(lot);

    const reservation = manager.create(Reservation, {
      id: reservationId,
      userId: input.userId,
      ticketLotId: input.ticketLotId,
      quantity: input.quantity,
      status: ReservationStatus.COMPLETED,
      expiresAt,
    });
    await manager.save(reservation);

    const order = manager.create(Order, {
      userId: input.userId,
      reservationId,
      totalPrice: 0,
      status: OrderStatus.PAID,
      paymentGatewayId,
    });
    await manager.save(order);

    let ticketIds: string[] = [];

    for (let attempt = 1; attempt <= CODE_INSERT_MAX_ATTEMPTS; attempt += 1) {
      const ticketsData = Array.from({ length: input.quantity }, () => ({
        orderId: order.id,
        ticketLotId: input.ticketLotId,
        ownerName: user.name,
        ownerDocument: user.document,
        uniqueCode: randomBytes(32).toString("hex"),
        checkInCode: generateTicketCheckInCode(),
        status: TicketStatus.ACTIVE,
      }));

      try {
        const insertResult = await manager.insert(Ticket, ticketsData);
        ticketIds = insertResult.identifiers.map(
          (identifier) => identifier.id as string,
        );
        break;
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === CODE_INSERT_MAX_ATTEMPTS) {
          throw error;
        }

        logger.warn(CONTEXT, "Ticket code collision — retrying insert", {
          attempt,
          orderId: order.id,
        });
      }
    }

    return {
      orderId: order.id,
      reservationId,
      ticketIds,
      ticketsIssued: ticketIds.length,
      eventId: lot.eventId,
      eventTitle: event.title,
      lotName: lot.name,
      userEmail: user.email,
      userName: user.name,
      availableQuantityAfter: lot.availableQuantity,
    };
  });

  try {
    const redis = getRedis();
    const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${input.ticketLotId}`;
    const currentStock = await redis.get(stockKey);

    if (currentStock !== null) {
      await redis.decrby(stockKey, input.quantity);
    } else {
      // Alinha Redis ao PG após decremento (evita SETNX posterior ignorar o hold).
      await redis.set(stockKey, String(result.availableQuantityAfter));
    }
  } catch (error) {
    logger.warn(CONTEXT, "Failed to sync Redis stock after manual ticket issue", {
      ticketLotId: input.ticketLotId,
      quantity: input.quantity,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info(CONTEXT, "Manual tickets issued", {
    orderId: result.orderId,
    userId: input.userId,
    ticketLotId: input.ticketLotId,
    quantity: input.quantity,
  });

  return result;
}
