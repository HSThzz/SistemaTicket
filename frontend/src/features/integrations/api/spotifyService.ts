/**
 * @file Cliente HTTP da integração Spotify.
 * @module features/integrations/api/spotifyService
 */

import { api } from "../../../shared/api/client";
import type { Event } from "../../../types/api";

export interface SpotifyStatus {
  configured: boolean;
  connected: boolean;
  displayName: string | null;
  spotifyUserId: string | null;
}

export interface SpotifyArtistRef {
  id: string;
  name: string;
}

export interface SpotifyRecommendedEvent extends Event {
  matchedArtists: SpotifyArtistRef[];
}

export interface SpotifyRecommendationsResponse {
  artists: SpotifyArtistRef[];
  events: SpotifyRecommendedEvent[];
}

export async function getSpotifyPublicConfig(): Promise<{ configured: boolean }> {
  const { data } = await api.get<{ configured: boolean }>("/auth/spotify/config");
  return data;
}

export async function getSpotifyStatus(): Promise<SpotifyStatus> {
  const { data } = await api.get<SpotifyStatus>("/auth/spotify/status");
  return data;
}

export async function getSpotifyConnectUrl(): Promise<string> {
  const { data } = await api.get<{ authorizationUrl: string }>("/auth/spotify/connect");
  return data.authorizationUrl;
}

export async function disconnectSpotify(): Promise<void> {
  await api.delete("/auth/spotify");
}

export async function getSpotifyRecommendations(): Promise<SpotifyRecommendationsResponse> {
  const { data } = await api.get<SpotifyRecommendationsResponse>(
    "/auth/spotify/recommendations",
  );
  return data;
}
