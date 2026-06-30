/**
 * @file Cliente HTTP para solicitações de participação em eventos privados.
 * @module modules/participation/api/participationService
 */

import { api } from "@/shared/api/client";
import type {
  ParticipationRequest,
  ParticipationRequestStatus,
} from "@/shared/types/api";

/** Payload de envio de uma solicitação de participação. */
export interface SubmitParticipationRequestInput {
  name: string;
  email: string;
  phone?: string;
}

/** Decisão do produtor sobre uma solicitação. */
export type ParticipationReviewDecision = "APPROVE" | "REJECT";

/**
 * Envia uma solicitação de participação para um evento privado.
 *
 * @param eventId - Identificador do evento.
 * @param input - Nome, e-mail e telefone do interessado.
 */
export async function submitParticipationRequest(
  eventId: string,
  input: SubmitParticipationRequestInput,
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
 * Aprova ou recusa uma solicitação de participação (produtor/equipe).
 *
 * @param eventId - Identificador do evento.
 * @param requestId - Identificador da solicitação.
 * @param decision - `APPROVE` ou `REJECT`.
 */
export async function reviewParticipationRequest(
  eventId: string,
  requestId: string,
  decision: ParticipationReviewDecision,
): Promise<ParticipationRequest> {
  const { data } = await api.patch<{ participationRequest: ParticipationRequest }>(
    `/events/${eventId}/participation-requests/${requestId}`,
    { decision },
  );
  return data.participationRequest;
}
