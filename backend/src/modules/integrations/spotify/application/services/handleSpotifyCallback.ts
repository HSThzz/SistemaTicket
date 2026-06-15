import { env, isSpotifyConfigured } from "../../../../../shared/infrastructure/config/env";
import {
  exchangeSpotifyAuthorizationCode,
  fetchSpotifyProfile,
} from "../../SpotifyClient";
import { verifySpotifyOAuthState } from "../../spotifyState";
import { upsertSpotifyConnection } from "../spotifyConnectionStore";
import { SpotifyOAuthError } from "../../domain/SpotifyError";

function buildFrontendReturnUrl(status: "connected" | "error", message?: string): string {
  const url = new URL(env.spotify.frontendReturnUrl);
  url.searchParams.set("spotify", status);
  if (message) {
    url.searchParams.set("spotify_message", message);
  }
  return url.toString();
}

export async function handleSpotifyCallback(params: {
  code?: string;
  state?: string;
  error?: string;
}): Promise<string> {
  if (!isSpotifyConfigured()) {
    return buildFrontendReturnUrl("error", "not_configured");
  }

  if (params.error) {
    return buildFrontendReturnUrl("error", params.error);
  }

  if (!params.code || !params.state) {
    return buildFrontendReturnUrl("error", "missing_code");
  }

  try {
    const userId = verifySpotifyOAuthState(params.state);
    const token = await exchangeSpotifyAuthorizationCode(params.code);
    const profile = await fetchSpotifyProfile(token.access_token);

    await upsertSpotifyConnection({
      userId,
      spotifyUserId: profile.id,
      displayName: profile.display_name,
      token,
    });

    return buildFrontendReturnUrl("connected");
  } catch {
    throw new SpotifyOAuthError();
  }
}

export function getSpotifyCallbackErrorRedirect(): string {
  return buildFrontendReturnUrl("error", "oauth_failed");
}
