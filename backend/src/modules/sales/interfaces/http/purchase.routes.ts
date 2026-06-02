/**
 * @file Rotas HTTP de compra e reserva (`/purchases`).
 * @module sales/interfaces/http/purchase.routes
 */

import { Router } from "express";
import { purchaseController } from "./PurchaseController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { reserveRateLimiter } from "../../../../shared/interfaces/http/middlewares/rateLimiter";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { UserRole } from "../../../../shared/kernel/enums";
import { validateBody, validateParams } from "../../../../shared/interfaces/http/middlewares/validate";
import { reserveBodySchema, reservationIdParamsSchema } from "../../../../shared/interfaces/http/validation/sales.schemas";

const router = Router();

router.post(
  "/reserve",
  reserveRateLimiter,
  authMiddleware,
  validateBody(reserveBodySchema),
  (req, res) => void purchaseController.reserve(req, res),
);

router.get(
  "/reservations/:reservationId",
  authMiddleware,
  validateParams(reservationIdParamsSchema),
  (req, res) => void purchaseController.getReservationStatus(req, res),
);

router.post(
  "/ops/stock/reconcile",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  (req, res) => void purchaseController.reconcileStock(req, res),
);

router.get(
  "/ops/queues",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void purchaseController.getQueueStats(req, res),
);

router.get(
  "/ops/worker",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void purchaseController.getWorkerMetrics(req, res),
);

router.get(
  "/ops/dlq",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void purchaseController.listDlq(req, res),
);

router.get(
  "/ops/retry-schedule",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void purchaseController.getRetrySchedule(req, res),
);

router.post(
  "/ops/dlq/reprocess",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void purchaseController.reprocessDlq(req, res),
);

/** Router Express montado em `/purchases`. */
export default router;
