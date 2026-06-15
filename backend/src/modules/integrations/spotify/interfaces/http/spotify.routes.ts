/**
 * @file Rotas HTTP da integração Spotify.
 * @module modules/integrations/spotify/interfaces/http/spotify.routes
 */

import { Router } from "express";
import { authMiddleware } from "../../../../../shared/interfaces/http/middlewares/authMiddleware";
import { spotifyController } from "./SpotifyController";

const router = Router();

router.get("/connect", authMiddleware, (req, res) =>
  void spotifyController.connect(req, res),
);

router.get("/callback", (req, res) => void spotifyController.callback(req, res));

router.get("/config", (req, res) => void spotifyController.config(req, res));

router.get("/status", authMiddleware, (req, res) =>
  void spotifyController.status(req, res),
);

router.delete("/", authMiddleware, (req, res) =>
  void spotifyController.disconnect(req, res),
);

router.get("/recommendations", authMiddleware, (req, res) =>
  void spotifyController.recommendations(req, res),
);

export default router;
