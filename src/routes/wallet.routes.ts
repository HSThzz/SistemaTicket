import { Router } from "express";
import { walletController } from "../controllers/WalletController";

const router = Router();

router.get(
  "/apple/:ticketId",
  (req, res) => void walletController.downloadApplePass(req, res),
);

router.get(
  "/google/:ticketId",
  (req, res) => void walletController.redirectGoogleWallet(req, res),
);

export default router;
