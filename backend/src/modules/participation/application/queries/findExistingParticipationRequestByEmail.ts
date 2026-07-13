/**
 * @file Query: verifica solicitação existente por e-mail no evento (dedupe unificado).
 * @module modules/participation/application/queries/findExistingParticipationRequestByEmail
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { normalizeParticipationEmail } from "../helpers/normalizeParticipationEmail";

export async function findExistingParticipationRequestByEmail(
  eventId: string,
  email: string,
): Promise<ParticipationRequest | null> {
  const normalizedEmail = normalizeParticipationEmail(email);

  return AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .where("request.event_id = :eventId", { eventId })
    .andWhere("LOWER(request.email) = :email", { email: normalizedEmail })
    .getOne();
}
