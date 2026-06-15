/**
 * @file Helpers de papéis de equipe (suporte e plataforma).
 * @module shared/kernel/staffRoles
 */

import { UserRole } from "./enums";

/** Papéis com acesso ao painel administrativo de suporte. */
export const STAFF_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
] as const;

/** Indica se o papel tem privilégios de suporte (ADMIN ou SUPER_ADMIN). */
export function isStaffRole(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/** Indica se o papel é super administrador da plataforma. */
export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}
