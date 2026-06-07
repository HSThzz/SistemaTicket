import { findPublishedEvents } from "../queries/findPublishedEvents";

export async function listPublishedEvents() {
  return findPublishedEvents();
}
