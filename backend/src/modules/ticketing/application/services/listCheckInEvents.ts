/**
 * @file Serviço: lista eventos disponíveis para check-in do ator autenticado.
 * @module modules/ticketing/application/services/listCheckInEvents
 */

import { findCheckInAccessibleEvents } from "../queries/findCheckInAccessibleEvents";
import type { CheckInActor } from "./types";

export interface CheckInEventListItem {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
}

export async function listCheckInEvents(
  actor: CheckInActor,
): Promise<CheckInEventListItem[]> {
  const events = await findCheckInAccessibleEvents(actor);
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date.toISOString(),
    location: event.location,
    status: event.status,
  }));
}
