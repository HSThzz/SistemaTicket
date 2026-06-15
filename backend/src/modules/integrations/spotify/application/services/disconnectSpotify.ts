import { deleteSpotifyConnection } from "../spotifyConnectionStore";

export async function disconnectSpotify(userId: string): Promise<{ disconnected: true }> {
  await deleteSpotifyConnection(userId);
  return { disconnected: true };
}
