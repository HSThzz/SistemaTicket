import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  createEventSchema,
  type CreateEventInputSchema,
} from "../../validators/schema/createEventSchema";
import { createEvent as createEventCommand } from "../commands/createEvent";
import { loadEventWithLots } from "../helpers/loadEventWithLots";
import { normalizeImageUrl } from "../helpers/normalizeImageUrl";
import type { EventActor } from "../types";

const CONTEXT = "createEvent";

export async function createEvent(
  dataSource: DataSource,
  input: CreateEventInputSchema,
  actor: EventActor,
): Promise<Event> {
  const data = validateSchema(createEventSchema, input);

  const saved = await createEventCommand(dataSource, {
    producerId: actor.userId,
    title: data.title,
    description: data.description,
    date: new Date(data.date),
    location: data.location,
    imageUrl: normalizeImageUrl(data.imageUrl),
    status: data.status ?? EventStatus.DRAFT,
  });

  Logger.getInstance().info(CONTEXT, "Event created", {
    eventId: saved.id,
    producerId: saved.producerId,
    status: saved.status,
  });

  return loadEventWithLots(dataSource, saved.id);
}
