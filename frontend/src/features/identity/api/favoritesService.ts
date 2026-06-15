/**
 * @file Cliente HTTP para favoritos do usuário autenticado.
 * @module features/identity/api/favoritesService
 */

import { api } from "../../../shared/api/client";
import type { Event } from "../../../types/api";

/** Lista IDs dos eventos favoritos do usuário. */
export async function listFavoriteIds(): Promise<string[]> {
  const { data } = await api.get<{ eventIds: string[] }>("/auth/me/favorites");
  return data.eventIds;
}

/** Lista eventos publicados favoritados pelo usuário. */
export async function listFavoriteEvents(): Promise<Event[]> {
  const { data } = await api.get<{ events: Event[] }>("/auth/me/favorites/events");
  return data.events;
}

/** Adiciona evento aos favoritos. */
export async function addFavorite(eventId: string): Promise<void> {
  await api.post(`/auth/me/favorites/${eventId}`);
}

/** Remove evento dos favoritos. */
export async function removeFavorite(eventId: string): Promise<void> {
  await api.delete(`/auth/me/favorites/${eventId}`);
}
