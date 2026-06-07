import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { EventNotFoundError } from "../../domain/errors/EventError";
import { createTicketLot as createTicketLotCommand } from "../commands/createTicketLot";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { findOneEventById } from "../queries/findOneEventById";
import type { CreateTicketLotInput, EventActor } from "../types";

const CONTEXT = "createTicketLot";

export async function createTicketLot(
  dataSource: DataSource,
  eventId: string,
  input: CreateTicketLotInput,
  actor: EventActor,
): Promise<TicketLot> {
  const event = await findOneEventById(dataSource, eventId);
  if (!event) {
    throw new EventNotFoundError(eventId);
  }

  assertCanManageEvent(event, actor);

  const availableQuantity = input.availableQuantity ?? input.totalQuantity;
  if (!Number.isInteger(input.price) || input.price < 0) {
    throw new Error("Invalid price");
  }
  if (!Number.isInteger(input.totalQuantity) || input.totalQuantity <= 0) {
    throw new Error("Invalid totalQuantity");
  }
  if (
    !Number.isInteger(availableQuantity) ||
    availableQuantity < 0 ||
    availableQuantity > input.totalQuantity
  ) {
    throw new Error("Invalid availableQuantity");
  }

  const saved = await createTicketLotCommand(dataSource, {
    eventId: event.id,
    name: input.name.trim(),
    price: input.price,
    totalQuantity: input.totalQuantity,
    availableQuantity,
  });

  Logger.getInstance().info(CONTEXT, "Ticket lot created", {
    ticketLotId: saved.id,
    eventId: event.id,
    actorUserId: actor.userId,
  });

  return saved;
}
