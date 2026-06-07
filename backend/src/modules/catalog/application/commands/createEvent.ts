/**
 * @file Command: persiste novo evento.
 * @module modules/catalog/application/commands/createEvent
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import type { EventStatus } from "../../../../shared/kernel/enums";

export interface CreateEventData {
  producerId: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl: string | null;
  status: EventStatus;
}

export async function createEvent(
  dataSource: DataSource,
  data: CreateEventData,
): Promise<Event> {
  const repository = dataSource.getRepository(Event);
  const event = repository.create(data);
  return repository.save(event);
}
