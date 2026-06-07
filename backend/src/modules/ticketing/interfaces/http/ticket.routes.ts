/**
 * @file Rotas HTTP de ingressos e check-in (`/tickets`).
 * @module ticketing/interfaces/http/ticket.routes
 */

import { Router } from "express";
import { checkInController } from "./CheckInController";
import { ticketController } from "./TicketController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { validateBody, validateQuery } from "../../../../shared/interfaces/http/middlewares/validate";
import {
  checkInBodySchema,
  listUserTicketsQuerySchema,
} from "../../../../shared/interfaces/http/validation/ticketing.schemas";
import { UserRole } from "../../../../shared/kernel/enums";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  validateQuery(listUserTicketsQuerySchema),
  (req, res) => void ticketController.listMine(req, res),
);

router.post(
  "/check-in",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
  validateBody(checkInBodySchema),
  (req, res) => void checkInController.checkIn(req, res),
);

/** Router Express montado em `/tickets`. */
export default router;
