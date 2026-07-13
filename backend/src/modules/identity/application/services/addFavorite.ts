import { Logger } from "../../../../shared/infrastructure/config/logger";
import { isUniqueViolation } from "../../../../shared/infrastructure/persistence/isUniqueViolation";
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

  try {
    await createUserFavorite(id, validatedEventId);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { eventId: validatedEventId, created: false };
    }

    throw error;
  }

  Logger.getInstance().info(CONTEXT, "Favorite added", {
    userId: id,
    eventId: validatedEventId,
  });

  return { eventId: validatedEventId, created: true };
}
