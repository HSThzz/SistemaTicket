import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import { createEvent as createEventCommand } from "../commands/createEvent";
import { loadEventWithLots } from "../helpers/loadEventWithLots";
import { normalizeImageUrl } from "../helpers/normalizeImageUrl";
import type { CreateEventInput, EventActor } from "../types";

const CONTEXT = "createEvent";

export async function createEvent(
  dataSource: DataSource,
  input: CreateEventInput,
  actor: EventActor,
): Promise<Event> {
  const date = new Date(input.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  const saved = await createEventCommand(dataSource, {
    producerId: actor.userId,
    title: input.title.trim(),
    description: input.description.trim(),
    date,
    location: input.location.trim(),
    imageUrl: normalizeImageUrl(input.imageUrl),
    status: input.status ?? EventStatus.DRAFT,
  });

  Logger.getInstance().info(CONTEXT, "Event created", {
    eventId: saved.id,
    producerId: saved.producerId,
    status: saved.status,
  });

  return loadEventWithLots(dataSource, saved.id);
}
