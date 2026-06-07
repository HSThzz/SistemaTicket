import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventNotFoundError } from "../../domain/errors/EventError";
import { updateEvent as updateEventCommand } from "../commands/updateEvent";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { loadEventWithLots } from "../helpers/loadEventWithLots";
import { normalizeImageUrl } from "../helpers/normalizeImageUrl";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor, UpdateEventInput } from "../types";

const CONTEXT = "updateEvent";

export async function updateEvent(
  dataSource: DataSource,
  eventId: string,
  input: UpdateEventInput,
  actor: EventActor,
): Promise<Event> {
  const event = await findOneEventById(dataSource, eventId);
  if (!event) {
    throw new EventNotFoundError(eventId);
  }

  assertCanManageEvent(event, actor);

  if (input.title !== undefined) event.title = input.title.trim();
  if (input.description !== undefined) event.description = input.description.trim();
  if (input.location !== undefined) event.location = input.location.trim();
  if (input.imageUrl !== undefined) event.imageUrl = normalizeImageUrl(input.imageUrl);
  if (input.status !== undefined) event.status = input.status;
  if (input.date !== undefined) {
    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    event.date = date;
  }

  const saved = await updateEventCommand(dataSource, event);

  Logger.getInstance().info(CONTEXT, "Event updated", {
    eventId: saved.id,
    producerId: saved.producerId,
    status: saved.status,
    actorUserId: actor.userId,
  });

  return loadEventWithLots(dataSource, saved.id);
}
