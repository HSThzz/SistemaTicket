/**
 * @file Valida se o evento pode ser publicado (lotes + data).
 * @module modules/catalog/application/helpers/assertCanPublishEvent
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import {
  EventPublishMissingLotsError,
  EventPublishPastDateError,
} from "../../domain/errors/EventError";
import { countTicketLotsByEventId } from "../queries/countTicketLotsByEventId";
import { formatCalendarDay } from "../../../ticketing/application/helpers/eventDay";

/**
 * Exige ao menos um lote e data do evento no dia de hoje ou no futuro (fuso SP).
 */
export async function assertCanPublishEvent(
  event: Event,
  nextDate?: Date,
): Promise<void> {
  const lotCount = await countTicketLotsByEventId(event.id);

  if (lotCount < 1) {
    throw new EventPublishMissingLotsError();
  }

  const eventDate = nextDate ?? event.date;
  const eventDay = formatCalendarDay(eventDate);
  const today = formatCalendarDay(new Date());

  if (eventDay < today) {
    throw new EventPublishPastDateError(eventDay);
  }
}
