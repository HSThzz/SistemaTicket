import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import {
  createTicketLotSchema,
  type CreateTicketLotInputSchema,
} from "../../validators/schema/createTicketLotSchema";
import { EventNotFoundError } from "../../domain/errors/EventError";
import { createTicketLot as createTicketLotCommand } from "../commands/createTicketLot";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";

const CONTEXT = "createTicketLot";

export async function createTicketLot(
  dataSource: DataSource,
  eventId: string,
  input: CreateTicketLotInputSchema,
  actor: EventActor,
): Promise<TicketLot> {
  const id = validateSchema(eventIdSchema, eventId);
  const data = validateSchema(createTicketLotSchema, input);

  const event = await findOneEventById(dataSource, id);
  if (!event) {
    throw new EventNotFoundError(id);
  }

  assertCanManageEvent(event, actor);

  const availableQuantity = data.availableQuantity ?? data.totalQuantity;

  const saved = await createTicketLotCommand(dataSource, {
    eventId: event.id,
    name: data.name,
    price: data.price,
    totalQuantity: data.totalQuantity,
    availableQuantity,
  });

  Logger.getInstance().info(CONTEXT, "Ticket lot created", {
    ticketLotId: saved.id,
    eventId: event.id,
    actorUserId: actor.userId,
  });

  return saved;
}
