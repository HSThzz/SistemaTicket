import { Router } from "express";
import { orderController } from "./OrderController";
import { UserRole } from "../../../../shared/kernel/enums";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";

const router = Router();

router.get("/me", authMiddleware, (req, res) => void orderController.listMine(req, res));

router.get(
  "/:id/payment",
  authMiddleware,
  (req, res) => void orderController.getPayment(req, res),
);

router.post(
  "/:id/refund",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  (req, res) => void orderController.refund(req, res),
);

export default router;

