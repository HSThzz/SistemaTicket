/**
 * @file Command: persiste nova solicitação de participação.
 * @module modules/participation/application/commands/createParticipationRequest
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type CreateParticipationRequestData = Prettify<
  Pick<ParticipationRequest, "eventId" | "userId" | "name" | "email" | "phone">
>;

export async function createParticipationRequest(
  data: CreateParticipationRequestData,
): Promise<ParticipationRequest> {
  const repository = AppDataSource.getRepository(ParticipationRequest);
  const request = repository.create(data);
  return repository.save(request);
}
