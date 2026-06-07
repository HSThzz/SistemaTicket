import type { DataSource } from "typeorm";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import { findOnePublishedEventById } from "../queries/findOnePublishedEventById";

export async function getPublishedEventById(
  dataSource: DataSource,
  eventId: string,
): Promise<Event | null> {
  const id = validateSchema(eventIdSchema, eventId);
  return findOnePublishedEventById(dataSource, id);
}
