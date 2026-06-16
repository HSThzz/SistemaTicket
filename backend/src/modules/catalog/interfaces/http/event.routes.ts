/**
 * @file Rotas HTTP do catálogo de eventos e lotes.
 * @module modules/catalog/interfaces/http/event.routes
 */

import { Router } from "express";
import { eventController, eventManagementMiddlewares } from "./EventController";
import { validateBody, validateParams } from "../../../../shared/interfaces/http/middlewares/validate";
import {
  createEventBodySchema,
  createTicketLotBodySchema,
  eventIdParamsSchema,
  updateEventBodySchema,
} from "../../../../shared/interfaces/http/validation/catalog.schemas";

const router = Router();

router.get("/", (req, res) => void eventController.listPublished(req, res));
router.get(
  "/mine/stats",
  ...eventManagementMiddlewares,
  (req, res) => void eventController.getMineStats(req, res),
);
router.get(
  "/mine",
  ...eventManagementMiddlewares,
  (req, res) => void eventController.listMine(req, res),
);
router.get(
  "/:eventId",
  validateParams(eventIdParamsSchema),
  (req, res) => void eventController.getPublished(req, res),
);

router.post(
  "/",
  ...eventManagementMiddlewares,
  validateBody(createEventBodySchema),
  (req, res) => void eventController.create(req, res),
);

router.patch(
  "/:eventId",
  ...eventManagementMiddlewares,
  validateParams(eventIdParamsSchema),
  validateBody(updateEventBodySchema),
  (req, res) => void eventController.update(req, res),
);

router.delete(
  "/:eventId",
  ...eventManagementMiddlewares,
  validateParams(eventIdParamsSchema),
  (req, res) => void eventController.remove(req, res),
);

router.post(
  "/:eventId/lots",
  ...eventManagementMiddlewares,
  validateParams(eventIdParamsSchema),
  validateBody(createTicketLotBodySchema),
  (req, res) => void eventController.createLot(req, res),
);

export default router;
