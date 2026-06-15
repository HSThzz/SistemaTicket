/**
 * @file Cliente HTTP para a API OAuth e Web do Spotify.
 * @module modules/integrations/spotify/SpotifyClient
 */

import { env } from "../../../shared/infrastructure/config/env";

const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = ["user-top-read", "user-read-email"] as const;

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyProfile {
  id: string;
  display_name: string | null;
  email?: string;
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

function getBasicAuthHeader(): string {
  const credentials = Buffer.from(
    `${env.spotify.clientId}:${env.spotify.clientSecret}`,
  ).toString("base64");
  return `Basic ${credentials}`;
}

export function buildSpotifyAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.spotify.clientId,
    scope: SPOTIFY_SCOPES.join(" "),
    redirect_uri: env.spotify.redirectUri,
    state,
    show_dialog: "true",
  });

  return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeSpotifyAuthorizationCode(
  code: string,
): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.spotify.redirectUri,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed (${response.status})`);
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export async function refreshSpotifyAccessToken(
  refreshToken: string,
): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed (${response.status})`);
  }

  return (await response.json()) as SpotifyTokenResponse;
}

async function spotifyApiGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
  return spotifyApiGet<SpotifyProfile>(accessToken, "/me");
}

export async function fetchSpotifyTopArtists(
  accessToken: string,
  limit = 20,
): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    time_range: "medium_term",
  });

  const data = await spotifyApiGet<SpotifyTopArtistsResponse>(
    accessToken,
    `/me/top/artists?${params.toString()}`,
  );

  return data.items;
}
