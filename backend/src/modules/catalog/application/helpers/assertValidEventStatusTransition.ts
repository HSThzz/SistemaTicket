import { EventStatus } from "../../../../shared/kernel/enums";
import { EventInvalidStatusTransitionError } from "../../domain/errors/EventError";

const ALLOWED_TRANSITIONS: Record<EventStatus, ReadonlySet<EventStatus>> = {
  [EventStatus.DRAFT]: new Set([
    EventStatus.DRAFT,
    EventStatus.PUBLISHED,
    EventStatus.CANCELLED,
  ]),
  [EventStatus.PUBLISHED]: new Set([
    EventStatus.PUBLISHED,
    EventStatus.CANCELLED,
    EventStatus.FINISHED,
  ]),
  [EventStatus.CANCELLED]: new Set([EventStatus.CANCELLED]),
  [EventStatus.FINISHED]: new Set([EventStatus.FINISHED]),
};

/**
 * Impede republicação ou retrocesso indevido de status (ex.: cancelado → publicado).
 */
export function assertValidEventStatusTransition(
  currentStatus: EventStatus,
  nextStatus: EventStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowed?.has(nextStatus)) {
    throw new EventInvalidStatusTransitionError(currentStatus, nextStatus);
  }
}
