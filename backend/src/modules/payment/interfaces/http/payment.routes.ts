/**
 * @file Rotas HTTP de pagamento (`/payments`).
 * @module payment/interfaces/http/payment.routes
 */

import { Router } from "express";
import { paymentController } from "./PaymentController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { validateBody } from "../../../../shared/interfaces/http/middlewares/validate";
import {
  createCardPaymentBodySchema,
  createPixPaymentBodySchema,
  simulateDevPaymentBodySchema,
} from "../../../../shared/interfaces/http/validation/payment.schemas";
import { validatePaymentWebhookBody } from "./webhookValidation";

const router = Router();

router.get("/config", (req, res) => void paymentController.getConfig(req, res));

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

router.post(
  "/card",
  authMiddleware,
  validateBody(createCardPaymentBodySchema),
  (req, res) => void paymentController.createCardPayment(req, res),
);

router.post(
  "/pix",
  authMiddleware,
  validateBody(createPixPaymentBodySchema),
  (req, res) => void paymentController.createPixPayment(req, res),
);

router.post(
  "/reconcile",
  authMiddleware,
  validateBody(createPixPaymentBodySchema),
  (req, res) => void paymentController.reconcilePixPayment(req, res),
);

/** Router Express montado em `/payments`. */
export default router;
