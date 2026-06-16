import { EventStatus } from "../../../../shared/kernel/enums";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  EventCannotDeleteError,
  EventNotFoundError,
} from "../../domain/errors/EventError";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import { archiveEvent } from "../commands/archiveEvent";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { assertEventIsActive } from "../helpers/assertEventIsActive";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";

const CONTEXT = "deleteEvent";

const DELETABLE_STATUSES = new Set<EventStatus>([
  EventStatus.CANCELLED,
  EventStatus.FINISHED,
]);

export async function deleteEvent(eventId: string, actor: EventActor): Promise<void> {
  const id = validateSchema(eventIdSchema, eventId);

  const event = await findOneEventById(id);
  if (!event) {
    throw new EventNotFoundError(id);
  }

  assertCanManageEvent(event, actor);
  assertEventIsActive(event);

  if (!DELETABLE_STATUSES.has(event.status)) {
    throw new EventCannotDeleteError(event.status);
  }

  await archiveEvent(event);

  Logger.getInstance().info(CONTEXT, "Event archived from producer list", {
    eventId: event.id,
    producerId: event.producerId,
    status: event.status,
    actorUserId: actor.userId,
  });
}
