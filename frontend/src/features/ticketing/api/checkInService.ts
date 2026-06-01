/**
 * @file Cliente HTTP para check-in de ingressos na entrada do evento.
 * @module features/ticketing/api/checkInService
 */

import { api } from "../../../shared/api/client";

/** Dados retornados após validar e registrar check-in de um ingresso. */
export interface CheckInResult {
  owner_name: string;
  owner_document: string;
  checked_in_at: string;
  ticket_id: string;
  event_title: string;
}

/**
 * Registra check-in pelo código único do ingresso (QR ou digitação).
 *
 * @param uniqueCode - Código impresso ou lido do QR Code.
 */
export async function checkInTicket(uniqueCode: string): Promise<CheckInResult> {
  const { data } = await api.post<CheckInResult>("/tickets/check-in", {
    unique_code: uniqueCode.trim(),
  });
  return data;
}
