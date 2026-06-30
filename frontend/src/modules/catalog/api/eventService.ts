/**
 * @file Cliente HTTP para catálogo e gestão de eventos (público e produtor).
 * @module modules/catalog/api/eventService
 */

import { api } from "@/shared/api/client";
import type { Event, ProducerDashboardStats, TicketLot } from "@/shared/types/api";

/** Payload para criação de evento pelo produtor. */
export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string | null;
  status?: string;
  type?: string;
}

/** Campos opcionais para atualização parcial de evento. */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  imageUrl?: string | null;
  status?: string;
  type?: string;
}

/** Payload para criação de lote de ingressos em um evento. */
export interface CreateTicketLotInput {
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity?: number;
}

/**
 * Lista eventos publicados na vitrine pública.
 */
export async function listPublishedEvents(): Promise<Event[]> {
  const { data } = await api.get<{ events: Event[] }>("/events");
  return data.events;
}

/**
 * Obtém detalhes de um evento publicado por ID.
 *
 * @param eventId - Identificador do evento.
 */
export async function getPublishedEvent(eventId: string): Promise<Event> {
  const { data } = await api.get<{ event: Event }>(`/events/${eventId}`);
  return data.event;
}

/**
 * Lista eventos gerenciados pelo produtor autenticado.
 */
export async function listManagedEvents(): Promise<Event[]> {
  const { data } = await api.get<{ events: Event[] }>("/events/mine");
  return data.events;
}

/**
 * Cria novo evento no painel do produtor.
 *
 * @param input - Dados do evento.
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data } = await api.post<{ event: Event }>("/events", input);
  return data.event;
}

/**
 * Atualiza campos de um evento existente.
 *
 * @param eventId - Identificador do evento.
 * @param input - Campos a alterar.
 */
export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<Event> {
  const { data } = await api.patch<{ event: Event }>(`/events/${eventId}`, input);
  return data.event;
}

/**
 * Remove evento cancelado ou encerrado da lista do produtor.
 *
 * @param eventId - Identificador do evento.
 */
export async function deleteManagedEvent(eventId: string): Promise<void> {
  await api.delete(`/events/${eventId}`);
}

/**
 * Adiciona lote de ingressos a um evento.
 *
 * @param eventId - Identificador do evento.
 * @param input - Nome, preço e quantidades do lote.
 */
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

/**
 * Obtém estatísticas agregadas do dashboard do produtor.
 */
export async function getProducerDashboardStats(): Promise<ProducerDashboardStats> {
  const { data } = await api.get<ProducerDashboardStats>("/events/mine/stats");
  return data;
}

/**
 * Busca um evento gerenciado pelo ID na lista do produtor.
 *
 * @param eventId - Identificador do evento.
 * @returns Evento encontrado ou `null`.
 */
export async function getManagedEvent(eventId: string): Promise<Event | null> {
  const events = await listManagedEvents();
  return events.find((event) => event.id === eventId) ?? null;
}
