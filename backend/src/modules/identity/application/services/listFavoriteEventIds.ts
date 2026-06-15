import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { findFavoriteEventIdsByUserId } from "../queries/findFavoriteEventIdsByUserId";

export async function listFavoriteEventIds(userId: string) {
  const id = validateSchema(userIdSchema, userId);
  return findFavoriteEventIdsByUserId(id);
}
