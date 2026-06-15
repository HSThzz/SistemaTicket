/**
 * @file Correspondência entre artistas Spotify e eventos publicados.
 * @module modules/catalog/application/helpers/matchEventsToArtists
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";

export interface SpotifyArtistMatch {
  id: string;
  name: string;
}

export interface EventArtistMatch {
  event: Event;
  matchedArtists: SpotifyArtistMatch[];
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function eventHaystack(event: Event): string {
  const artists = Array.isArray(event.artists) ? event.artists.join(" ") : "";
  return normalizeText(`${event.title} ${event.description} ${artists}`);
}

function artistMatchesHaystack(artistName: string, haystack: string): boolean {
  const normalizedArtist = normalizeText(artistName);
  if (!normalizedArtist) {
    return false;
  }

  return haystack.includes(normalizedArtist);
}

/**
 * Retorna eventos publicados que batem com pelo menos um artista do Spotify.
 *
 * @param events - Eventos candidatos.
 * @param artists - Artistas do top do usuário.
 */
export function matchEventsToArtists(
  events: Event[],
  artists: SpotifyArtistMatch[],
): EventArtistMatch[] {
  const matches: EventArtistMatch[] = [];

  for (const event of events) {
    const haystack = eventHaystack(event);
    const matchedArtists = artists.filter((artist) =>
      artistMatchesHaystack(artist.name, haystack),
    );

    if (matchedArtists.length > 0) {
      matches.push({ event, matchedArtists });
    }
  }

  return matches.sort(
    (left, right) =>
      right.matchedArtists.length - left.matchedArtists.length ||
      new Date(left.event.date).getTime() - new Date(right.event.date).getTime(),
  );
}
