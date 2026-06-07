/**
 * @file Command: persiste novo evento.
 * @module modules/catalog/application/commands/createEvent
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import type { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export interface CreateEventData {
  producerId: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl: string | null;
  status: EventStatus;
}

export async function createEvent(data: CreateEventData,
): Promise<Event> {
  const repository = AppDataSource.getRepository(Event);
  const event = repository.create(data);
  return repository.save(event);
}


