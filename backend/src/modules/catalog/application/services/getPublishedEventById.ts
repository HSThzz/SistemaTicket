import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventPublicIdSchema } from "../../validators/schema/eventIdSchema";
import { findOnePublishedEventById } from "../queries/findOnePublishedEventById";

export async function getPublishedEventById(
  eventIdOrSlug: string,
) {
  const idOrSlug = validateSchema(eventPublicIdSchema, eventIdOrSlug);
  return findOnePublishedEventById(idOrSlug);
}
