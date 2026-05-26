import { Router } from "express";
import { checkInController } from "../controllers/CheckInController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../entities/enums";

const router = Router();

router.post(
  "/check-in",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void checkInController.checkIn(req, res),
);

export default router;
