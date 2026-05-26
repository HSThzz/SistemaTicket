import { Router } from "express";
import { purchaseController } from "../controllers/PurchaseController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { reserveRateLimiter } from "../middlewares/rateLimiter";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../entities/enums";

const router = Router();

router.post(
  "/reserve",
  reserveRateLimiter,
  authMiddleware,
  (req, res) => void purchaseController.reserve(req, res),
);

router.get(
  "/reservations/:reservationId",
  authMiddleware,
  (req, res) => void purchaseController.getReservationStatus(req, res),
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

router.post(
  "/ops/dlq/reprocess",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void purchaseController.reprocessDlq(req, res),
);

export default router;
