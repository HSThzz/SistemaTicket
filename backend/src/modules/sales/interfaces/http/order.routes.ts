/**
 * @file Rotas HTTP de pedidos do cliente (`/orders`).
 * @module sales/interfaces/http/order.routes
 */

import { Router } from "express";
import { orderController } from "./OrderController";
import { UserRole } from "../../../../shared/kernel/enums";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { validateParams } from "../../../../shared/interfaces/http/middlewares/validate";
import { orderIdParamsSchema } from "../../../../shared/interfaces/http/validation/sales.schemas";

const router = Router();

router.get("/me", authMiddleware, (req, res) => void orderController.listMine(req, res));

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  validateParams(orderIdParamsSchema),
  (req, res) => void orderController.getByIdAdmin(req, res),
);

router.get(
  "/:id/payment",
  authMiddleware,
  validateParams(orderIdParamsSchema),
  (req, res) => void orderController.getPayment(req, res),
);

router.post(
  "/:id/refund",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  validateParams(orderIdParamsSchema),
  (req, res) => void orderController.refund(req, res),
);

/** Router Express montado em `/orders`. */
export default router;
