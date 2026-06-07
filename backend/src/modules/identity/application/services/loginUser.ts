import bcrypt from "bcrypt";
import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { InvalidCredentialsError } from "../../domain/errors/AuthError";
import { buildAuthResponse } from "../helpers/buildAuthResponse";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";
import type { AuthResponse, LoginInput } from "../types";

const CONTEXT = "loginUser";

export async function loginUser(
  dataSource: DataSource,
  input: LoginInput,
): Promise<AuthResponse> {
  const user = await findOneUserByEmail(dataSource, input.email);

  if (!user) {
    Logger.getInstance().warn(CONTEXT, "Failed login attempt", {
      email: input.email.toLowerCase(),
      reason: "user_not_found",
    });
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    Logger.getInstance().warn(CONTEXT, "Failed login attempt", {
      email: user.email,
      userId: user.id,
      reason: "invalid_password",
    });
    throw new InvalidCredentialsError();
  }

  Logger.getInstance().info(CONTEXT, "User logged in", {
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return buildAuthResponse(user);
}
