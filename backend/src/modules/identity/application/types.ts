/**
 * @file Tipos compartilhados do módulo de identidade.
 * @module modules/identity/application/types
 */

import type { UserRole } from "../../../shared/kernel/enums";

/** Dados de entrada para cadastro de novo usuário. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  document: string;
}

/** Dados de entrada para autenticação por email e senha. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Claims embutidos no token JWT emitido. */
export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

/** Dados públicos do usuário autenticado. */
export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Resposta de autenticação com token e dados públicos do usuário. */
export interface AuthResponse {
  token: string;
  user: AuthUserProfile;
}
