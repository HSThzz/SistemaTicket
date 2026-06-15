/**
 * @file Estado assinado para o fluxo OAuth do Spotify.
 * @module modules/integrations/spotify/spotifyState
 */

import jwt from "jsonwebtoken";
import { env } from "../../../shared/infrastructure/config/env";

interface SpotifyStatePayload {
  purpose: "spotify_oauth";
  userId: string;
}

export function createSpotifyOAuthState(userId: string): string {
  const payload: SpotifyStatePayload = {
    purpose: "spotify_oauth",
    userId,
  };

  return jwt.sign(payload, env.jwt.secret, { expiresIn: "10m" });
}

export function verifySpotifyOAuthState(state: string): string {
  const payload = jwt.verify(state, env.jwt.secret) as SpotifyStatePayload;

  if (payload.purpose !== "spotify_oauth" || !payload.userId) {
    throw new Error("Invalid Spotify OAuth state");
  }

  return payload.userId;
}
