import { findManagedEventsByActor } from "../queries/findManagedEventsByActor";
import type { EventActor } from "../types";

export async function listManagedEvents(
  actor: EventActor,
) {
  return findManagedEventsByActor(actor);
}
