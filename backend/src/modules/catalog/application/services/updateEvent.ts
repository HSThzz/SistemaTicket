import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import {
  updateEventSchema,
  type UpdateEventInputSchema,
} from "../../validators/schema/updateEventSchema";
import { updateEvent as updateEventCommand } from "../commands/updateEvent";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { loadEventWithLots } from "../helpers/loadEventWithLots";
import { normalizeImageUrl } from "../helpers/normalizeImageUrl";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";
import { EventNotFoundError } from "../../domain/errors/EventError";

const CONTEXT = "updateEvent";

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

  if (data.title !== undefined) event.title = data.title;
  if (data.description !== undefined) event.description = data.description;
  if (data.location !== undefined) event.location = data.location;
  if (data.imageUrl !== undefined) event.imageUrl = normalizeImageUrl(data.imageUrl);
  if (data.status !== undefined) event.status = data.status;
  if (data.date !== undefined) event.date = new Date(data.date);

  const saved = await updateEventCommand(event);

  Logger.getInstance().info(CONTEXT, "Event updated", {
    eventId: saved.id,
    producerId: saved.producerId,
    status: saved.status,
    actorUserId: actor.userId,
  });

  return loadEventWithLots(saved.id);
}
