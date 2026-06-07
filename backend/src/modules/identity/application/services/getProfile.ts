import type { DataSource } from "typeorm";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import { findOneUserById } from "../queries/findOneUserById";
import type { AuthUserProfile } from "../types";

export async function getProfile(
  dataSource: DataSource,
  userId: string,
): Promise<AuthUserProfile> {
  const user = await findOneUserById(dataSource, userId);

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
