/**
 * @file Serviço: retorna a solicitação de participação do usuário logado para um evento.
 * @module modules/participation/application/services/getMyParticipationRequest
 */

import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { uuidSchema } from "../../../../shared/kernel/zodFields";
import { findExistingParticipationRequest } from "../queries/findExistingParticipationRequest";

export async function getMyParticipationRequest(eventId: string, userId: string) {
  const id = validateSchema(uuidSchema, eventId);
  return findExistingParticipationRequest(id, userId);
}
