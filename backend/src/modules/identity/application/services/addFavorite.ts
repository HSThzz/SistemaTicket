import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { EventNotFoundError } from "../../../catalog/domain/errors/EventError";
import { findOnePublishedEventById } from "../../../catalog/application/queries/findOnePublishedEventById";
import { eventIdSchema } from "../../../catalog/validators/schema/eventIdSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { createUserFavorite } from "../commands/createUserFavorite";
import { findOneUserFavorite } from "../queries/findOneUserFavorite";

const CONTEXT = "addFavorite";

export async function addFavorite(userId: string, eventId: string) {
  const id = validateSchema(userIdSchema, userId);
  const validatedEventId = validateSchema(eventIdSchema, eventId);

  const event = await findOnePublishedEventById(validatedEventId);

  if (!event) {
    throw new EventNotFoundError(validatedEventId);
  }

  const existingFavorite = await findOneUserFavorite(id, validatedEventId);

  if (existingFavorite) {
    return { eventId: validatedEventId, created: false };
  }

  await createUserFavorite(id, validatedEventId);

  Logger.getInstance().info(CONTEXT, "Favorite added", {
    userId: id,
    eventId: validatedEventId,
  });

  return { eventId: validatedEventId, created: true };
}
