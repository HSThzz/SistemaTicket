/**
 * @file Persistência e refresh de tokens Spotify do usuário.
 * @module modules/integrations/spotify/application/spotifyConnectionStore
 */

import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { isSpotifyConfigured } from "../../../../shared/infrastructure/config/env";
import { UserSpotifyConnection } from "../../../../shared/infrastructure/persistence/entities/UserSpotifyConnection";
import {
  refreshSpotifyAccessToken,
  type SpotifyTokenResponse,
} from "../SpotifyClient";
import { SpotifyNotConfiguredError, SpotifyNotConnectedError } from "../domain/SpotifyError";

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export async function findSpotifyConnectionByUserId(
  userId: string,
): Promise<UserSpotifyConnection | null> {
  return AppDataSource.getRepository(UserSpotifyConnection).findOne({
    where: { userId },
  });
}

export async function upsertSpotifyConnection(params: {
  userId: string;
  spotifyUserId: string;
  displayName: string | null;
  token: SpotifyTokenResponse;
}): Promise<UserSpotifyConnection> {
  const repository = AppDataSource.getRepository(UserSpotifyConnection);
  const existing = await repository.findOne({ where: { userId: params.userId } });

  const expiresAt = addSeconds(new Date(), params.token.expires_in);
  const refreshToken = params.token.refresh_token ?? existing?.refreshToken;

  if (!refreshToken) {
    throw new Error("Spotify refresh token missing");
  }

  const entity = repository.create({
    userId: params.userId,
    spotifyUserId: params.spotifyUserId,
    displayName: params.displayName,
    accessToken: params.token.access_token,
    refreshToken,
    expiresAt,
    scope: params.token.scope,
  });

  return repository.save(entity);
}

export async function deleteSpotifyConnection(userId: string): Promise<void> {
  await AppDataSource.getRepository(UserSpotifyConnection).delete({ userId });
}

export async function getValidSpotifyAccessToken(
  userId: string,
): Promise<{ accessToken: string; connection: UserSpotifyConnection }> {
  if (!isSpotifyConfigured()) {
    throw new SpotifyNotConfiguredError();
  }

  const connection = await findSpotifyConnectionByUserId(userId);

  if (!connection) {
    throw new SpotifyNotConnectedError();
  }

  const expiresSoon = connection.expiresAt.getTime() <= Date.now() + 60_000;

  if (!expiresSoon) {
    return { accessToken: connection.accessToken, connection };
  }

  const refreshed = await refreshSpotifyAccessToken(connection.refreshToken);
  const updated = await upsertSpotifyConnection({
    userId,
    spotifyUserId: connection.spotifyUserId,
    displayName: connection.displayName,
    token: {
      ...refreshed,
      refresh_token: refreshed.refresh_token ?? connection.refreshToken,
    },
  });

  return { accessToken: updated.accessToken, connection: updated };
}
