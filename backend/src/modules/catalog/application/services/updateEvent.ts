import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import {
  updateEventSchema,
  type UpdateEventInputSchema,
} from "../../validators/schema/updateEventSchema";
import {
  updateEvent as updateEventCommand,
  type UpdateEventData,
} from "../commands/updateEvent";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { loadEventWithLots } from "../helpers/loadEventWithLots";
import { normalizeImageUrl } from "../helpers/normalizeImageUrl";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";
import { EventNotFoundError } from "../../domain/errors/EventError";

const CONTEXT = "updateEvent";

function buildUpdateEventData(input: UpdateEventInputSchema): UpdateEventData {
  const changes: UpdateEventData = {};

  if (input.title !== undefined) changes.title = input.title;
  if (input.description !== undefined) changes.description = input.description;
  if (input.location !== undefined) changes.location = input.location;
  if (input.imageUrl !== undefined) changes.imageUrl = normalizeImageUrl(input.imageUrl);
  if (input.status !== undefined) changes.status = input.status;
  if (input.date !== undefined) changes.date = new Date(input.date);

  return changes;
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInputSchema,
  actor: EventActor,
) {
  const id = validateSchema(eventIdSchema, eventId);
  const data = validateSchema(updateEventSchema, input);

  const event = await findOneEventById(id);
  if (!event) {
    throw new EventNotFoundError(id);
  }

  assertCanManageEvent(event, actor);

  const changes = buildUpdateEventData(data);
  const saved = await updateEventCommand(event, changes);

  Logger.getInstance().info(CONTEXT, "Event updated", {
    eventId: saved.id,
    producerId: saved.producerId,
    status: saved.status,
    actorUserId: actor.userId,
  });

  return loadEventWithLots(saved.id);
}
