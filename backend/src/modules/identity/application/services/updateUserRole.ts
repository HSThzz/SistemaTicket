import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { UserRole } from "../../../../shared/kernel/enums";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import { updateUser } from "../commands/updateUser";
import { findOneUserById } from "../queries/findOneUserById";
import type { AuthUserProfile } from "../types";

const CONTEXT = "updateUserRole";

export async function updateUserRole(
  dataSource: DataSource,
  userId: string,
  role: UserRole,
): Promise<AuthUserProfile> {
  const user = await findOneUserById(dataSource, userId);

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  user.role = role;
  await updateUser(dataSource, user);

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
