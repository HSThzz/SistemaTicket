import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../../catalog/validators/schema/eventIdSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { deleteUserFavorite } from "../commands/deleteUserFavorite";

const CONTEXT = "removeFavorite";

export async function removeFavorite(userId: string, eventId: string) {
  const id = validateSchema(userIdSchema, userId);
  const validatedEventId = validateSchema(eventIdSchema, eventId);

  const removed = await deleteUserFavorite(id, validatedEventId);

  if (removed) {
    Logger.getInstance().info(CONTEXT, "Favorite removed", {
      userId: id,
      eventId: validatedEventId,
    });
  }

  return { eventId: validatedEventId, removed };
}
