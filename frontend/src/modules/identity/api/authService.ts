/**
 * @file Cliente HTTP para autenticação (login, cadastro e perfil).
 * @module modules/identity/api/authService
 */

import { api } from "@/shared/api/client";
import type { AuthResponse, AuthUser, AdminAuditLogEntry } from "@/shared/types/api";

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
  /** Aceite explícito dos Termos e da Política de Privacidade. */
  acceptedTerms: true;
  /** Versão dos documentos legais aceitos (ex.: "1.0"). */
  termsVersion: string;
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

/** Dados para atualização de perfil. */
export interface UpdateProfileInput {
  name: string;
  email: string;
  document: string;
  /** Obrigatório quando o e-mail muda. */
  currentPassword?: string;
}

/**
 * Atualiza nome, e-mail e documento do usuário autenticado.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  const { data } = await api.patch<{ user: AuthUser }>("/auth/me", input);
  return data.user;
}

/** Dados para alteração de senha. */
export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** Dados para solicitar redefinição de senha. */
export interface ForgotPasswordInput {
  email: string;
}

/** Dados para redefinir senha com token do e-mail. */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Altera a senha do usuário autenticado e retorna nova sessão (token + user).
 */
export async function updatePassword(input: UpdatePasswordInput): Promise<AuthResponse> {
  const { data } = await api.patch<AuthResponse>("/auth/me/password", input);
  return data;
}

/**
 * Encerra a sessão atual no servidor (denylist do JWT).
 */
export async function logout(): Promise<{ success: true }> {
  const { data } = await api.post<{ success: true }>("/auth/logout");
  return data;
}

/**
 * Solicita envio de link de redefinição de senha por e-mail.
 */
export async function forgotPassword(input: ForgotPasswordInput): Promise<{ success: true }> {
  const { data } = await api.post<{ success: true }>("/auth/forgot-password", input);
  return data;
}

/**
 * Redefine a senha com token recebido por e-mail.
 */
export async function resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/reset-password", input);
  return data;
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
 * Altera o papel de um usuário (super admin).
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

/** Dados para redefinição de senha por admin. */
export interface AdminResetUserPasswordInput {
  newPassword: string;
}

/**
 * Redefine a senha de outro usuário (equipe admin).
 */
export async function adminResetUserPassword(
  userId: string,
  input: AdminResetUserPasswordInput,
): Promise<{ success: true }> {
  const { data } = await api.patch<{ success: true }>(
    `/auth/users/${userId}/password`,
    input,
  );
  return data;
}

/**
 * Lista auditoria de ações sensíveis (super admin).
 */
export async function listAdminAuditLogs(
  limit = 50,
): Promise<AdminAuditLogEntry[]> {
  const { data } = await api.get<{ logs: AdminAuditLogEntry[] }>(
    "/auth/admin/audit-logs",
    { params: { limit } },
  );
  return data.logs;
}
