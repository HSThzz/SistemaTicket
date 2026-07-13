import { Logger } from "../../../../shared/infrastructure/config/logger";
import { EventStatus, EventType } from "../../../../shared/kernel/enums";
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
  input: CreateEventInputSchema,
  actor: EventActor,
) {
  const data = validateSchema(createEventSchema, input);

  const saved = await createEventCommand({
    producerId: actor.userId,
    title: data.title,
    description: data.description,
    date: new Date(data.date),
    location: data.location,
    imageUrl: normalizeImageUrl(data.imageUrl),
    status: EventStatus.DRAFT,
    type: data.type ?? EventType.PUBLIC,
  });

  Logger.getInstance().info(CONTEXT, "Event created", {
    eventId: saved.id,
    producerId: saved.producerId,
    status: saved.status,
  });

  return loadEventWithLots(saved.id);
}
