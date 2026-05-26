import { api } from "./api";
import type { Event } from "../types/api";

export async function listPublishedEvents(): Promise<Event[]> {
  const { data } = await api.get<{ events: Event[] }>("/events");
  return data.events;
}

export async function getPublishedEvent(eventId: string): Promise<Event> {
  const { data } = await api.get<{ event: Event }>(`/events/${eventId}`);
  return data.event;
}
