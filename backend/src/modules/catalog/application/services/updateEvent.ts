import { Logger } from "../../../../shared/infrastructure/config/logger";
import { EventStatus } from "../../../../shared/kernel/enums";
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
import { assertCanPublishEvent } from "../helpers/assertCanPublishEvent";
import { assertEventIsActive } from "../helpers/assertEventIsActive";
import { assertEventAllowsContentEdit } from "../helpers/assertEventMutable";
import { assertValidEventStatusTransition } from "../helpers/assertValidEventStatusTransition";
import { assertValidEventTypeChange } from "../helpers/assertValidEventTypeChange";
import { loadEventWithLots } from "../helpers/loadEventWithLots";
import { normalizeImageUrl } from "../helpers/normalizeImageUrl";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";
import { EventNotFoundError } from "../../domain/errors/EventError";

const CONTEXT = "updateEvent";

const CONTENT_FIELDS = [
  "title",
  "description",
  "location",
  "imageUrl",
  "date",
  "type",
] as const;

function buildUpdateEventData(input: UpdateEventInputSchema): UpdateEventData {
  const changes: UpdateEventData = {};

  if (input.title !== undefined) changes.title = input.title;
  if (input.description !== undefined) changes.description = input.description;
  if (input.location !== undefined) changes.location = input.location;
  if (input.imageUrl !== undefined) changes.imageUrl = normalizeImageUrl(input.imageUrl);
  if (input.status !== undefined) changes.status = input.status;
  if (input.type !== undefined) changes.type = input.type;
  if (input.date !== undefined) changes.date = new Date(input.date);

  return changes;
}

function hasContentChanges(changes: UpdateEventData): boolean {
  return CONTENT_FIELDS.some((field) => changes[field] !== undefined);
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
  assertEventIsActive(event);

  const changes = buildUpdateEventData(data);

  if (hasContentChanges(changes)) {
    assertEventAllowsContentEdit(event);
  }

  if (changes.status !== undefined) {
    assertValidEventStatusTransition(event.status, changes.status);
  }

  if (changes.type !== undefined) {
    await assertValidEventTypeChange(event, changes.type);
  }

  const publishing =
    changes.status === EventStatus.PUBLISHED &&
    event.status !== EventStatus.PUBLISHED;

  if (publishing) {
    await assertCanPublishEvent(event, changes.date);
  }

  const saved = await updateEventCommand(event, changes);

  Logger.getInstance().info(CONTEXT, "Event updated", {
    eventId: saved.id,
    producerId: saved.producerId,
    status: saved.status,
    actorUserId: actor.userId,
  });

  return loadEventWithLots(saved.id);
}
