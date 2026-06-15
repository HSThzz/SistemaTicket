import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { findFavoritePublishedEventsByUserId } from "../queries/findFavoritePublishedEventsByUserId";

export async function listFavoriteEvents(userId: string) {
  const id = validateSchema(userIdSchema, userId);
  return findFavoritePublishedEventsByUserId(id);
}
