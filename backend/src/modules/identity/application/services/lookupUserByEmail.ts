import type { DataSource } from "typeorm";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";
import type { AuthUserProfile } from "../types";

export async function lookupUserByEmail(
  dataSource: DataSource,
  email: string,
): Promise<AuthUserProfile> {
  const user = await findOneUserByEmail(dataSource, email);

  if (!user) {
    throw new UserNotFoundError(email);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
