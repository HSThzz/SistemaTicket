/**
 * @file Serviço: lista todas as solicitações de participação do usuário logado.
 * @module modules/participation/application/services/listMyParticipationRequests
 */

import { findParticipationRequestsByUserId } from "../queries/findParticipationRequestsByUserId";

export async function listMyParticipationRequests(userId: string) {
  return findParticipationRequestsByUserId(userId);
}
