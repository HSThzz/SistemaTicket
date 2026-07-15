/**
 * @file Rotas HTTP de pedidos do cliente (`/orders`).
 * @module sales/interfaces/http/order.routes
 */

import { Router } from "express";
import { orderController } from "./OrderController";
import { UserRole } from "../../../../shared/kernel/enums";
import { STAFF_ROLES } from "../../../../shared/kernel/staffRoles";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { validateParams, validateQuery } from "../../../../shared/interfaces/http/middlewares/validate";
import {
  listUserOrdersQuerySchema,
  orderIdParamsSchema,
} from "../../../../shared/interfaces/http/validation/sales.schemas";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  validateQuery(listUserOrdersQuerySchema),
  (req, res) => void orderController.listMine(req, res),
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware([...STAFF_ROLES]),
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
  roleMiddleware([...STAFF_ROLES, UserRole.PRODUCER]),
  validateParams(orderIdParamsSchema),
  (req, res) => void orderController.refund(req, res),
);

/** Router Express montado em `/orders`. */
export default router;
