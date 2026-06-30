/**
 * @file Rótulos e cores de badges para status de pedidos, eventos e ingressos.
 * @module utils/statusLabels
 */

import type { BadgeProps } from "@mantine/core";

/**
 * Retorna o rótulo em português do status de um pedido.
 *
 * @param status - Código de status do pedido (ex.: `PENDING`, `PAID`).
 */
export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "PAID":
      return "Pago";
    case "FAILED":
      return "Falhou";
    case "REFUNDED":
      return "Reembolsado";
    default:
      return status;
  }
}

/**
 * Retorna a cor Mantine do badge conforme o status do pedido.
 *
 * @param status - Código de status do pedido.
 */
export function getOrderStatusColor(status: string): BadgeProps["color"] {
  switch (status) {
    case "PENDING":
      return "yellow";
    case "PAID":
      return "green";
    case "FAILED":
      return "red";
    case "REFUNDED":
      return "gray";
    default:
      return "gray";
  }
}

/**
 * Retorna o rótulo em português do status de um evento.
 *
 * @param status - Código de status do evento (ex.: `PUBLISHED`, `DRAFT`).
 */
export function getEventStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Rascunho";
    case "PUBLISHED":
      return "Publicado";
    case "CANCELLED":
      return "Cancelado";
    case "FINISHED":
      return "Encerrado";
    default:
      return status;
  }
}

/**
 * Retorna a cor Mantine do badge conforme o status do evento.
 *
 * @param status - Código de status do evento.
 */
export function getEventStatusColor(status: string): BadgeProps["color"] {
  switch (status) {
    case "DRAFT":
      return "gray";
    case "PUBLISHED":
      return "green";
    case "CANCELLED":
      return "red";
    case "FINISHED":
      return "blue";
    default:
      return "gray";
  }
}

/**
 * Retorna o rótulo em português do tipo de evento.
 *
 * @param type - Código do tipo (`PUBLIC` ou `PRIVATE`).
 */
export function getEventTypeLabel(type: string): string {
  switch (type) {
    case "PUBLIC":
      return "Público";
    case "PRIVATE":
      return "Privado";
    default:
      return type;
  }
}

/**
 * Retorna o rótulo em português do status de uma solicitação de participação.
 *
 * @param status - Código de status (`PENDING`, `APPROVED`, `REJECTED`).
 */
export function getParticipationStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "APPROVED":
      return "Aprovada";
    case "REJECTED":
      return "Recusada";
    default:
      return status;
  }
}

/**
 * Retorna a cor Mantine do badge conforme o status da solicitação de participação.
 *
 * @param status - Código de status da solicitação.
 */
export function getParticipationStatusColor(status: string): BadgeProps["color"] {
  switch (status) {
    case "PENDING":
      return "yellow";
    case "APPROVED":
      return "green";
    case "REJECTED":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Retorna o rótulo em português do status de um ingresso.
 *
 * @param status - Código de status do ingresso (ex.: `ACTIVE`, `USED`).
 */
export function getTicketStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Ativo";
    case "USED":
      return "Utilizado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

/**
 * Retorna a cor Mantine do badge conforme o status do ingresso.
 *
 * @param status - Código de status do ingresso.
 */
export function getTicketStatusColor(status: string): BadgeProps["color"] {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "USED":
      return "blue";
    case "CANCELLED":
      return "red";
    default:
      return "gray";
  }
}
