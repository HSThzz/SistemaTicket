import { Router } from "express";
import { walletController } from "../controllers/WalletController";
import { authMiddleware } from "../middlewares/authMiddleware";

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

export default router;
