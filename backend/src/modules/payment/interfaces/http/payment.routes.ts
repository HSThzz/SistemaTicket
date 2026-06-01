import { Router } from "express";
import { paymentController } from "./PaymentController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";

const router = Router();

router.post("/webhook", (req, res) => void paymentController.webhook(req, res));

router.post(
  "/dev/simulate",
  authMiddleware,
  (req, res) => void paymentController.simulateDevPayment(req, res),
);

export default router;
