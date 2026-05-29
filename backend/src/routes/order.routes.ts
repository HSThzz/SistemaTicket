import { Router } from "express";
import { orderController } from "../controllers/OrderController";
import { UserRole } from "../entities/enums";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

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

