/**
 * @file Erros de domínio da integração Spotify.
 * @module modules/integrations/spotify/domain/SpotifyError
 */

export class SpotifyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "SpotifyError";
  }
}

export class SpotifyNotConfiguredError extends SpotifyError {
  constructor() {
    super("Spotify integration is not configured", "SPOTIFY_NOT_CONFIGURED");
  }
}

export class SpotifyNotConnectedError extends SpotifyError {
  constructor() {
    super("Spotify account is not connected", "SPOTIFY_NOT_CONNECTED");
  }
}

export class SpotifyOAuthError extends SpotifyError {
  constructor(message = "Spotify authorization failed") {
    super(message, "SPOTIFY_OAUTH_FAILED");
  }
}
