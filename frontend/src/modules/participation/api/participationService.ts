/**
 * @file Cliente HTTP para solicitações de participação em eventos privados.
 * @module modules/participation/api/participationService
 */

import { api } from "@/shared/api/client";
import type {
  PaidParticipant,
  ParticipationRequest,
  ParticipationRequestStatus,
} from "@/shared/types/api";

/** Payload de envio — nome/e-mail vêm da conta; telefone e Instagram opcionais. */
export interface SubmitParticipationRequestInput {
  phone?: string;
  instagramHandle?: string;
}

/** Decisão do produtor sobre uma solicitação. */
export type ParticipationReviewDecision = "APPROVE" | "REJECT";

/**
 * Envia uma solicitação de participação para um evento privado.
 *
 * @param eventId - Identificador do evento.
 * @param input - Telefone e Instagram opcionais do interessado.
 */
export async function submitParticipationRequest(
  eventId: string,
  input: SubmitParticipationRequestInput = {},
): Promise<ParticipationRequest> {
  const { data } = await api.post<{ participationRequest: ParticipationRequest }>(
    `/events/${eventId}/participation-requests`,
    input,
  );
  return data.participationRequest;
}

/**
 * Consulta a solicitação do usuário logado para um evento (ou `null`).
 *
 * @param eventId - Identificador do evento.
 */
export async function getMyParticipationRequest(
  eventId: string,
): Promise<ParticipationRequest | null> {
  const { data } = await api.get<{
    participationRequest: ParticipationRequest | null;
  }>(`/events/${eventId}/participation-requests/me`);
  return data.participationRequest;
}

/**
 * Lista todas as solicitações de participação do usuário logado.
 */
export async function listMyParticipationRequests(): Promise<ParticipationRequest[]> {
  const { data } = await api.get<{ participationRequests: ParticipationRequest[] }>(
    "/events/participation-requests/mine",
  );
  return data.participationRequests;
}

/**
 * Lista as solicitações de um evento por status (produtor/equipe).
 *
 * @param eventId - Identificador do evento.
 * @param status - Status a filtrar (padrão `PENDING`).
 */
export async function listParticipationRequests(
  eventId: string,
  status: ParticipationRequestStatus = "PENDING",
): Promise<ParticipationRequest[]> {
  const { data } = await api.get<{ participationRequests: ParticipationRequest[] }>(
    `/events/${eventId}/participation-requests`,
    { params: { status } },
  );
  return data.participationRequests;
}

/**
 * Lista compradores com pedido pago em um evento privado (produtor/equipe).
 *
 * @param eventId - Identificador do evento.
 */
export async function listPaidParticipants(
  eventId: string,
): Promise<PaidParticipant[]> {
  const { data } = await api.get<{ paidParticipants: PaidParticipant[] }>(
    `/events/${eventId}/paid-participants`,
  );
  return data.paidParticipants;
}

/**
 * Aprova ou recusa uma solicitação de participação (produtor/equipe).
 *
 * @param eventId - Identificador do evento.
 * @param requestId - Identificador da solicitação.
 * @param decision - `APPROVE` ou `REJECT`.
 * @param ticketLotIds - Obrigatório ao aprovar: lotes liberados para compra.
 */
export async function reviewParticipationRequest(
  eventId: string,
  requestId: string,
  decision: ParticipationReviewDecision,
  ticketLotIds?: string[],
): Promise<ParticipationRequest> {
  const { data } = await api.patch<{ participationRequest: ParticipationRequest }>(
    `/events/${eventId}/participation-requests/${requestId}`,
    {
      decision,
      ...(decision === "APPROVE" ? { ticketLotIds } : {}),
    },
  );
  return data.participationRequest;
}

/**
 * Atualiza os lotes liberados de uma participação já aprovada.
 */
export async function updateAllowedTicketLots(
  eventId: string,
  requestId: string,
  ticketLotIds: string[],
): Promise<ParticipationRequest> {
  const { data } = await api.patch<{ participationRequest: ParticipationRequest }>(
    `/events/${eventId}/participation-requests/${requestId}/allowed-lots`,
    { ticketLotIds },
  );
  return data.participationRequest;
}
