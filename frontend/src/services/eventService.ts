import { api } from "./api";
import type { Event, ProducerDashboardStats, TicketLot } from "../types/api";

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string | null;
  status?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  imageUrl?: string | null;
  status?: string;
}

export interface CreateTicketLotInput {
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity?: number;
}

export async function listPublishedEvents(): Promise<Event[]> {
  const { data } = await api.get<{ events: Event[] }>("/events");
  return data.events;
}

export async function getPublishedEvent(eventId: string): Promise<Event> {
  const { data } = await api.get<{ event: Event }>(`/events/${eventId}`);
  return data.event;
}

export async function listManagedEvents(): Promise<Event[]> {
  const { data } = await api.get<{ events: Event[] }>("/events/mine");
  return data.events;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data } = await api.post<{ event: Event }>("/events", input);
  return data.event;
}

export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<Event> {
  const { data } = await api.patch<{ event: Event }>(`/events/${eventId}`, input);
  return data.event;
}

export async function createTicketLot(
  eventId: string,
  input: CreateTicketLotInput,
): Promise<TicketLot & { eventId: string }> {
  const { data } = await api.post<{ ticketLot: TicketLot & { eventId: string } }>(
    `/events/${eventId}/lots`,
    input,
  );
  return data.ticketLot;
}

export async function getProducerDashboardStats(): Promise<ProducerDashboardStats> {
  const { data } = await api.get<ProducerDashboardStats>("/events/mine/stats");
  return data;
}

export async function getManagedEvent(eventId: string): Promise<Event | null> {
  const events = await listManagedEvents();
  return events.find((event) => event.id === eventId) ?? null;
}
