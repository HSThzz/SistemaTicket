/**
 * @file Regras de ciclo de vida do evento para participação.
 * @module modules/participation/application/helpers/assertEventParticipationLifecycle
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus, EventType } from "../../../../shared/kernel/enums";
import {
  ParticipationEventNotAcceptingError,
  ParticipationEventNotFoundError,
  ParticipationEventNotReviewableError,
  ParticipationNotPrivateEventError,
} from "../../domain/errors/ParticipationError";

const REVIEW_BLOCKED_STATUSES = new Set<EventStatus>([
  EventStatus.CANCELLED,
  EventStatus.FINISHED,
]);

/** Soft-delete e tipo privado + publicado para novas solicitações. */
export function assertEventAcceptsParticipationRequests(event: Event): void {
  if (event.deletedAt) {
    throw new ParticipationEventNotFoundError(event.id);
  }

  if (event.type !== EventType.PRIVATE) {
    throw new ParticipationNotPrivateEventError();
  }

  if (event.status !== EventStatus.PUBLISHED) {
    throw new ParticipationEventNotAcceptingError();
  }
}

/** Soft-delete e status terminal bloqueiam aprovar/recusar. */
export function assertEventAllowsParticipationReview(event: Event): void {
  if (event.deletedAt) {
    throw new ParticipationEventNotFoundError(event.id);
  }

  if (REVIEW_BLOCKED_STATUSES.has(event.status)) {
    throw new ParticipationEventNotReviewableError(event.status);
  }
}
