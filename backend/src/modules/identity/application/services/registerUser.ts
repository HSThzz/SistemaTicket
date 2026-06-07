import bcrypt from "bcrypt";
import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { UserRole } from "../../../../shared/kernel/enums";
import { EmailAlreadyExistsError } from "../../domain/errors/AuthError";
import { createUser } from "../commands/createUser";
import { buildAuthResponse } from "../helpers/buildAuthResponse";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";
import type { AuthResponse, RegisterInput } from "../types";

const CONTEXT = "registerUser";
const BCRYPT_ROUNDS = 12;

export async function registerUser(
  dataSource: DataSource,
  input: RegisterInput,
): Promise<AuthResponse> {
  const existingUser = await findOneUserByEmail(dataSource, input.email);

  if (existingUser) {
    throw new EmailAlreadyExistsError(input.email);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await createUser(dataSource, {
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    document: input.document,
    role: UserRole.CLIENT,
  });

  Logger.getInstance().info(CONTEXT, "User registered", {
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return buildAuthResponse(user);
}
