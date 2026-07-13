import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import {
  createTicketLotSchema,
  type CreateTicketLotInputSchema,
} from "../../validators/schema/createTicketLotSchema";
import { EventNotFoundError } from "../../domain/errors/EventError";
import { createTicketLot as createTicketLotCommand } from "../commands/createTicketLot";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { assertEventIsActive } from "../helpers/assertEventIsActive";
import { assertEventAllowsNewLots } from "../helpers/assertEventMutable";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";

const CONTEXT = "createTicketLot";

export async function createTicketLot(
  eventId: string,
  input: CreateTicketLotInputSchema,
  actor: EventActor,
) {
  const id = validateSchema(eventIdSchema, eventId);
  const data = validateSchema(createTicketLotSchema, input);

  const event = await findOneEventById(id);
  if (!event) {
    throw new EventNotFoundError(id);
  }

  assertCanManageEvent(event, actor);
  assertEventIsActive(event);
  assertEventAllowsNewLots(event);

  const availableQuantity = data.availableQuantity ?? data.totalQuantity;

  const saved = await createTicketLotCommand({
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
