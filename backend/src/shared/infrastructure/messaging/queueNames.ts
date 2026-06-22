/**
 * @file Nomes das filas BullMQ da aplicação.
 * @module shared/infrastructure/messaging/queueNames
 */

/** Fila de entrega de ingressos (PDF + e-mail transacional). */
export const TICKET_DELIVERY_QUEUE = "ticket-delivery";

/** Fila de notificações do formulário de contato de produtores. */
export const CONTACT_FORM_QUEUE = "contact-form";

/** Fila de notificações de participação aprovada em eventos privados. */
export const PARTICIPATION_NOTIFICATION_QUEUE = "participation-notification";
