import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import { findOnePublishedEventById } from "../queries/findOnePublishedEventById";

export async function getPublishedEventById(
  eventId: string,
) {
  const id = validateSchema(eventIdSchema, eventId);
  return findOnePublishedEventById(id);
}
