import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import {
  updateUserRoleSchema,
  type UpdateUserRoleInputSchema,
} from "../../validators/schema/updateUserRoleSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { updateUser } from "../commands/updateUser";
import { findOneUserById } from "../queries/findOneUserById";

const CONTEXT = "updateUserRole";

export async function updateUserRole(
  userId: string,
  input: UpdateUserRoleInputSchema,
) {
  const id = validateSchema(userIdSchema, userId);
  const data = validateSchema(updateUserRoleSchema, input);

  const user = await findOneUserById(id);

  if (!user) {
    throw new UserNotFoundError(id);
  }

  user.role = data.role;
  await updateUser(user);

  Logger.getInstance().info(CONTEXT, "User role updated", {
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
