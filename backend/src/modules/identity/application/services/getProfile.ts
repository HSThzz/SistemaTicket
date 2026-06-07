import type { DataSource } from "typeorm";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { findOneUserById } from "../queries/findOneUserById";
import type { AuthUserProfile } from "../types";

export async function getProfile(
  dataSource: DataSource,
  userId: string,
): Promise<AuthUserProfile> {
  const id = validateSchema(userIdSchema, userId);
  const user = await findOneUserById(dataSource, id);

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
