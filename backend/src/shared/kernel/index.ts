/**
 * @file Ponto de entrada do kernel compartilhado (enumeradores de domínio).
 * @module shared/kernel
 */

export {
  EventStatus,
  OrderStatus,
  ReservationStatus,
  TicketStatus,
  UserRole,
} from "./enums";

export { ValidationError, validateSchema } from "./validateSchema";
export type { ValidationIssue } from "./validateSchema";
export type { Prettify } from "./prettify";
