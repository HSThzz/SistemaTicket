import type { DataSource } from "typeorm";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { findOnePublishedEventById } from "../queries/findOnePublishedEventById";

export async function getPublishedEventById(
  dataSource: DataSource,
  eventId: string,
): Promise<Event | null> {
  return findOnePublishedEventById(dataSource, eventId);
}
