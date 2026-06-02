/**
 * @file Cliente HTTP para autenticação (login, cadastro e perfil).
 * @module features/identity/api/authService
 */

import { api } from "../../../shared/api/client";
import type { AuthResponse, AuthUser } from "../../../types/api";

/** Credenciais de login. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Dados para cadastro de novo usuário cliente. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  document: string;
}

/**
 * Autentica usuário e retorna token JWT com perfil.
 *
 * @param input - E-mail e senha.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  return data;
}

/**
 * Registra nova conta e retorna sessão autenticada.
 *
 * @param input - Nome, e-mail, senha e documento (CPF).
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  return data;
}

/**
 * Obtém o perfil do usuário autenticado (`/auth/me`).
 */
export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

/**
 * Busca usuário por e-mail (admin).
 */
export async function lookupUserByEmail(email: string): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>("/auth/users/lookup", {
    params: { email },
  });
  return data.user;
}

/**
 * Altera o papel de um usuário (admin).
 */
export async function updateUserRole(
  userId: string,
  role: AuthUser["role"],
): Promise<AuthUser> {
  const { data } = await api.patch<{ user: AuthUser }>(
    `/auth/users/${userId}/role`,
    { role },
  );
  return data.user;
}
