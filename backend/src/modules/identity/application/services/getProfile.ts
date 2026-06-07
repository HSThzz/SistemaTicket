import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { findOneUserById } from "../queries/findOneUserById";

export async function getProfile(
  userId: string,
) {
  const id = validateSchema(userIdSchema, userId);
  const user = await findOneUserById(id);

  if (!user) {
    throw new UserNotFoundError(id);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
