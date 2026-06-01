import { Router } from "express";
import { checkInController } from "./CheckInController";
import { ticketController } from "./TicketController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { UserRole } from "../../../../shared/kernel/enums";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  (req, res) => void ticketController.listMine(req, res),
);

router.post(
  "/check-in",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  (req, res) => void checkInController.checkIn(req, res),
);

export default router;
