/**
 * @file Regras de mutação de evento por status (lotes e edição de conteúdo).
 * @module modules/catalog/application/helpers/assertEventMutable
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import {
  EventLotNotAllowedError,
  EventNotEditableError,
} from "../../domain/errors/EventError";

const LOT_ALLOWED_STATUSES = new Set<EventStatus>([
  EventStatus.DRAFT,
  EventStatus.PUBLISHED,
]);

const CONTENT_LOCKED_STATUSES = new Set<EventStatus>([
  EventStatus.CANCELLED,
  EventStatus.FINISHED,
]);

/** Impede criar lotes em eventos cancelados ou encerrados. */
export function assertEventAllowsNewLots(event: Event): void {
  if (!LOT_ALLOWED_STATUSES.has(event.status)) {
    throw new EventLotNotAllowedError(event.status);
  }
}

/** Impede editar conteúdo (título, data, etc.) após cancelar/encerrar. */
export function assertEventAllowsContentEdit(event: Event): void {
  if (CONTENT_LOCKED_STATUSES.has(event.status)) {
    throw new EventNotEditableError(event.status);
  }
}
