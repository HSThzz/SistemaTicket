/**
 * @file Tipos compartilhados do módulo de identidade.
 * @module modules/identity/application/types
 */

import type { UserRole } from "../../../shared/kernel/enums";
import type { LoginUserInputSchema } from "../validators/schema/loginUserSchema";
import type { RegisterUserInputSchema } from "../validators/schema/registerUserSchema";

export type { LoginUserInputSchema } from "../validators/schema/loginUserSchema";
export type { RegisterUserInputSchema } from "../validators/schema/registerUserSchema";
export type { UpdateUserRoleInputSchema } from "../validators/schema/updateUserRoleSchema";

/** Alias legado — prefira `RegisterUserInputSchema`. */
export type RegisterInput = RegisterUserInputSchema;
/** Alias legado — prefira `LoginUserInputSchema`. */
export type LoginInput = LoginUserInputSchema;

/** Claims embutidos no token JWT emitido. */
export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  /** Timestamp (ms) da última troca de senha; `0` se nunca alterada. */
  pwdAt: number;
  /** Identificador único do token (logout / denylist). Ausente em tokens legados. */
  jti?: string;
}

/** Dados públicos do usuário autenticado. */
export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** CPF (apenas dígitos); somente em `/auth/me` e após atualização de perfil. */
  document?: string;
}

/** Resposta de autenticação com token e dados públicos do usuário. */
export interface AuthResponse {
  token: string;
  user: AuthUserProfile;
}
