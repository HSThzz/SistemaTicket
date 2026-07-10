import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../../../shared/infrastructure/config/env";
import type { User } from "../../../../shared/infrastructure/persistence/entities/User";
import type { AuthResponse, AuthTokenPayload } from "../types";
import { getUserPwdAt } from "./authToken";
import { toUserProfile } from "./toUserProfile";

export function buildAuthResponse(user: User): AuthResponse {
  const payload: AuthTokenPayload = {
    userId: user.id,
    role: user.role,
    pwdAt: getUserPwdAt(user.passwordChangedAt),
  };

  const signOptions: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
  };

  const token = jwt.sign(payload, env.jwt.secret, signOptions);

  return {
    token,
    user: toUserProfile(user),
  };
}
