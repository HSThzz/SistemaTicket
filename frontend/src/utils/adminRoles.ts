/**
 * @file Helpers de papéis administrativos no frontend.
 * @module utils/adminRoles
 */

import type { UserRole } from "../types/api";

/** Papéis com acesso ao painel de suporte. */
export function isStaffRole(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** Indica super administrador da plataforma. */
export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === "SUPER_ADMIN";
}

/** Papéis que podem acessar o painel do produtor. */
export function isProducerPanelRole(role: UserRole | undefined): boolean {
  return role === "PRODUCER" || isStaffRole(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: "Cliente",
  PRODUCER: "Produtor",
  ADMIN: "Suporte (Admin)",
  SUPER_ADMIN: "Super Admin",
};

export const ASSIGNABLE_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "CLIENT", label: ROLE_LABELS.CLIENT },
  { value: "PRODUCER", label: ROLE_LABELS.PRODUCER },
  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
  { value: "SUPER_ADMIN", label: ROLE_LABELS.SUPER_ADMIN },
];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_ROLE_UPDATED: "Papel alterado",
  ORDER_REFUNDED: "Pedido reembolsado",
  STOCK_RECONCILED: "Estoque reconciliado",
  TICKETS_ISSUED_MANUALLY: "Ingressos emitidos manualmente",
};

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "grape";
    case "ADMIN":
      return "blue";
    case "PRODUCER":
      return "teal";
    default:
      return "gray";
  }
}
