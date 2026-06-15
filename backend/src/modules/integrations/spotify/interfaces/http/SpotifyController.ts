/**
 * @file Controlador HTTP da integração Spotify.
 * @module modules/integrations/spotify/interfaces/http/SpotifyController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../../shared/infrastructure/config/logger";
import {
  SpotifyError,
  SpotifyNotConfiguredError,
  SpotifyNotConnectedError,
  SpotifyOAuthError,
} from "../../domain/SpotifyError";
import { disconnectSpotify } from "../../application/services/disconnectSpotify";
import {
  getSpotifyCallbackErrorRedirect,
  handleSpotifyCallback,
} from "../../application/services/handleSpotifyCallback";
import { getSpotifyConnectUrl } from "../../application/services/getSpotifyConnectUrl";
import { getSpotifyRecommendations } from "../../application/services/getSpotifyRecommendations";
import { getSpotifyPublicConfig } from "../../application/services/getSpotifyPublicConfig";
import { getSpotifyStatus } from "../../application/services/getSpotifyStatus";

const CONTEXT = "SpotifyController";
const logger = Logger.getInstance();

export class SpotifyController {
  async connect(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const result = await getSpotifyConnectUrl(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async callback(req: Request, res: Response): Promise<void> {
    const query = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    try {
      const redirectUrl = await handleSpotifyCallback(query);
      res.redirect(302, redirectUrl);
    } catch (error) {
      logger.warn(CONTEXT, "Spotify OAuth callback failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.redirect(302, getSpotifyCallbackErrorRedirect());
    }
  }

  async status(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const status = await getSpotifyStatus(req.user.id);
      res.status(200).json(status);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async config(_req: Request, res: Response): Promise<void> {
    res.status(200).json(getSpotifyPublicConfig());
  }

  async disconnect(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const result = await disconnectSpotify(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async recommendations(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const result = await getSpotifyRecommendations(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof SpotifyNotConfiguredError) {
      res.status(503).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof SpotifyNotConnectedError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof SpotifyOAuthError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof SpotifyError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, "Unexpected Spotify error", {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}

export const spotifyController = new SpotifyController();
