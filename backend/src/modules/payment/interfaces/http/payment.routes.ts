/**
 * @file Rotas HTTP de pagamento (`/payments`).
 * @module payment/interfaces/http/payment.routes
 */

import { Router } from "express";
import { paymentController } from "./PaymentController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { validateBody } from "../../../../shared/interfaces/http/middlewares/validate";
import { simulateDevPaymentBodySchema } from "../../../../shared/interfaces/http/validation/payment.schemas";
import { validatePaymentWebhookBody } from "./webhookValidation";

const router = Router();

router.post(
  "/webhook",
  validatePaymentWebhookBody,
  (req, res) => void paymentController.webhook(req, res),
);

router.post(
  "/dev/simulate",
  authMiddleware,
  validateBody(simulateDevPaymentBodySchema),
  (req, res) => void paymentController.simulateDevPayment(req, res),
);

/** Router Express montado em `/payments`. */
export default router;
