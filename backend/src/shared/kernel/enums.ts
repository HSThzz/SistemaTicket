/**
 * @file Enumeradores de domínio compartilhados entre módulos.
 * @module shared/kernel/enums
 */

/** Papéis de usuário no sistema. */
export enum UserRole {
  CLIENT = "CLIENT",
  PRODUCER = "PRODUCER",
  ADMIN = "ADMIN",
}

/** Status do ciclo de vida de um evento. */
export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  FINISHED = "FINISHED",
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
