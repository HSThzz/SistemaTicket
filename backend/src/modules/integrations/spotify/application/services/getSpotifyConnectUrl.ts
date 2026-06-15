import { isSpotifyConfigured } from "../../../../../shared/infrastructure/config/env";
import { buildSpotifyAuthorizationUrl } from "../../SpotifyClient";
import { createSpotifyOAuthState } from "../../spotifyState";
import { SpotifyNotConfiguredError } from "../../domain/SpotifyError";

export async function getSpotifyConnectUrl(userId: string): Promise<{ authorizationUrl: string }> {
  if (!isSpotifyConfigured()) {
    throw new SpotifyNotConfiguredError();
  }

  const state = createSpotifyOAuthState(userId);

  return {
    authorizationUrl: buildSpotifyAuthorizationUrl(state),
  };
}
