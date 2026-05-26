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

export default router;
