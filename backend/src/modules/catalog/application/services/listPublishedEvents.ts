import type { DataSource } from "typeorm";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { findPublishedEvents } from "../queries/findPublishedEvents";

export async function listPublishedEvents(
  dataSource: DataSource,
): Promise<Event[]> {
  return findPublishedEvents(dataSource);
}
