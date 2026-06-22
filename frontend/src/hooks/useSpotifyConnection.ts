/**
 * @file Estado da conexão Spotify e recomendações de eventos.
 * @module hooks/useSpotifyConnection
 */

import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import * as spotifyService from "../features/integrations/api/spotifyService";
import type { SpotifyRecommendationsResponse, SpotifyStatus } from "../features/integrations/api/spotifyService";
import { useAuth } from "../context/AuthContext";
import { useResetOnPageReturn } from "./useResetOnPageReturn";
import { getApiErrorMessage } from "../utils/errors";

const GUEST_STATUS: SpotifyStatus = {
  configured: false,
  connected: false,
  displayName: null,
  spotifyUserId: null,
};

export function useSpotifyConnection() {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SpotifyStatus>(GUEST_STATUS);
  const [recommendations, setRecommendations] =
    useState<SpotifyRecommendationsResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useResetOnPageReturn(useCallback(() => setConnecting(false), []));

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true);

    try {
      if (!isAuthenticated) {
        const publicConfig = await spotifyService.getSpotifyPublicConfig();
        setStatus({
          ...GUEST_STATUS,
          configured: publicConfig.configured,
        });
        setRecommendations(null);
        return;
      }

      const nextStatus = await spotifyService.getSpotifyStatus();
      setStatus(nextStatus);
    } catch {
      setStatus(GUEST_STATUS);
    } finally {
      setLoadingStatus(false);
    }
  }, [isAuthenticated]);

  const refreshRecommendations = useCallback(async () => {
    if (!isAuthenticated || !status.connected) {
      setRecommendations(null);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const data = await spotifyService.getSpotifyRecommendations();
      setRecommendations(data);
    } catch (error) {
      setRecommendations(null);
      notifications.show({
        title: "Não foi possível carregar recomendações",
        message: getApiErrorMessage(error, "Tente reconectar o Spotify."),
        color: "red",
      });
    } finally {
      setLoadingRecommendations(false);
    }
  }, [isAuthenticated, status.connected]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (status.connected) {
      void refreshRecommendations();
    } else {
      setRecommendations(null);
    }
  }, [status.connected, refreshRecommendations]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const authorizationUrl = await spotifyService.getSpotifyConnectUrl();
      window.location.assign(authorizationUrl);
    } catch (error) {
      notifications.show({
        title: "Spotify indisponível",
        message: getApiErrorMessage(
          error,
          "Não foi possível iniciar a conexão. Tente novamente em instantes.",
        ),
        color: "red",
      });
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await spotifyService.disconnectSpotify();
      setStatus((current) => ({ ...current, connected: false, displayName: null }));
      setRecommendations(null);
      notifications.show({
        title: "Spotify desconectado",
        message: "Suas recomendações personalizadas foram removidas.",
        color: "gray",
      });
    } catch (error) {
      notifications.show({
        title: "Erro ao desconectar",
        message: getApiErrorMessage(error, "Tente novamente em instantes."),
        color: "red",
      });
    } finally {
      setDisconnecting(false);
    }
  }, []);

  return {
    status,
    recommendations,
    loadingStatus,
    loadingRecommendations,
    connecting,
    disconnecting,
    connect,
    disconnect,
    refreshStatus,
    refreshRecommendations,
  };
}
