/**
 * @file Enumeradores de domínio compartilhados entre módulos.
 * @module shared/kernel/enums
 */

/** Papéis de usuário no sistema. */
export enum UserRole {
  CLIENT = "CLIENT",
  PRODUCER = "PRODUCER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

/** Ações sensíveis registradas na auditoria administrativa. */
export enum AdminAuditAction {
  USER_ROLE_UPDATED = "USER_ROLE_UPDATED",
  ORDER_REFUNDED = "ORDER_REFUNDED",
  STOCK_RECONCILED = "STOCK_RECONCILED",
}

/** Status do ciclo de vida de um evento. */
export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  FINISHED = "FINISHED",
}

/** Visibilidade do evento e fluxo de aquisição de ingressos. */
export enum EventType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

/** Status de uma solicitação de participação em evento privado. */
export enum ParticipationRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/** Status de uma reserva temporária de ingressos. */
export enum ReservationStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

/** Status de um pedido de compra. */
export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

/** Status de um ingresso emitido. */
export enum TicketStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  CANCELLED = "CANCELLED",
}
