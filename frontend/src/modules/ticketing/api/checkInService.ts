/**
 * @file Cliente HTTP para check-in de ingressos na entrada do evento.
 * @module modules/ticketing/api/checkInService
 */

import { api } from "@/shared/api/client";

/** Dados comuns de pré-visualização / confirmação de check-in. */
export interface CheckInPreviewResult {
  owner_name: string;
  owner_document: string;
  ticket_id: string;
  event_title: string;
  lot_name: string;
  /** Centavos; 0 = gratuito. */
  lot_price: number;
}

/** Dados após confirmar entrada (ingresso marcado como usado). */
export interface CheckInResult extends CheckInPreviewResult {
  checked_in_at: string;
}

/** Evento disponível para check-in hoje. */
export interface CheckInEventOption {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
}

/**
 * Indica se o usuário autenticado pode abrir a área de check-in.
 */
export async function getCheckInAccess(): Promise<boolean> {
  const { data } = await api.get<{ canCheckIn: boolean }>("/tickets/check-in/access");
  return data.canCheckIn;
}

/**
 * Lista eventos do dia em que o ator pode validar ingressos.
 */
export async function listCheckInEvents(): Promise<CheckInEventOption[]> {
  const { data } = await api.get<{ events: CheckInEventOption[] }>(
    "/tickets/check-in/events",
  );
  return data.events;
}

/**
 * Pré-visualiza o ingresso sem marcar como usado.
 */
export async function previewCheckIn(
  checkInCode: string,
): Promise<CheckInPreviewResult> {
  const { data } = await api.post<CheckInPreviewResult>("/tickets/check-in/preview", {
    unique_code: checkInCode.trim(),
  });
  return data;
}

/**
 * Confirma check-in pelo código do ingresso (QR ou digitação).
 */
export async function checkInTicket(checkInCode: string): Promise<CheckInResult> {
  const { data } = await api.post<CheckInResult>("/tickets/check-in", {
    unique_code: checkInCode.trim(),
  });
  return data;
}
