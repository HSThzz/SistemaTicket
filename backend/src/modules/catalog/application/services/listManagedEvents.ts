import type { DataSource } from "typeorm";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { findManagedEventsByActor } from "../queries/findManagedEventsByActor";
import type { EventActor } from "../types";

export async function listManagedEvents(
  dataSource: DataSource,
  actor: EventActor,
): Promise<Event[]> {
  return findManagedEventsByActor(dataSource, actor);
}
