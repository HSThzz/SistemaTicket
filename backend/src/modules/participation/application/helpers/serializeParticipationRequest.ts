/**
 * @file Serializa entidade ParticipationRequest para resposta JSON da API.
 * @module modules/participation/application/helpers/serializeParticipationRequest
 */

import type { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";

export function serializeParticipationRequest(request: ParticipationRequest) {
  return {
    id: request.id,
    eventId: request.eventId,
    userId: request.userId,
    name: request.name,
    email: request.email,
    phone: request.phone,
    instagramHandle: request.instagramHandle,
    status: request.status,
    reviewedBy: request.reviewedBy,
    reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
    createdAt: request.createdAt.toISOString(),
  };
}
