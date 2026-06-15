import { isSpotifyConfigured } from "../../../../../shared/infrastructure/config/env";
import { findSpotifyConnectionByUserId } from "../spotifyConnectionStore";

export async function getSpotifyStatus(userId: string) {
  const configured = isSpotifyConfigured();
  const connection = configured ? await findSpotifyConnectionByUserId(userId) : null;

  return {
    configured,
    connected: Boolean(connection),
    displayName: connection?.displayName ?? null,
    spotifyUserId: connection?.spotifyUserId ?? null,
  };
}
