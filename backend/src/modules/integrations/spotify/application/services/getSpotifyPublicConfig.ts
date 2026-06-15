import { isSpotifyConfigured } from "../../../../../shared/infrastructure/config/env";

export function getSpotifyPublicConfig() {
  return {
    configured: isSpotifyConfigured(),
  };
}
