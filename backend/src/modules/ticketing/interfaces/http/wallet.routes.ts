/**
 * @file Rotas HTTP de carteira digital (`/wallet`).
 * @module ticketing/interfaces/http/wallet.routes
 */

import { Router } from "express";
import { walletController } from "./WalletController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";

const router = Router();

router.get(
  "/apple/:ticketId",
  authMiddleware,
  (req, res) => void walletController.downloadApplePass(req, res),
);

router.get(
  "/google/:ticketId",
  authMiddleware,
  (req, res) => void walletController.redirectGoogleWallet(req, res),
);

router.get(
  "/google/:ticketId/link",
  authMiddleware,
  (req, res) => void walletController.getGoogleWalletLink(req, res),
);

/** Router Express montado em `/wallet`. */
export default router;
