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
  eventPublicIdParamsSchema,
  eventLotParamsSchema,
  eventStaffParamsSchema,
  addCheckInStaffBodySchema,
  updateEventBodySchema,
  updateTicketLotBodySchema,
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
  validateParams(eventPublicIdParamsSchema),
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

router.patch(
  "/:eventId/lots/:lotId",
  ...eventManagementMiddlewares,
  validateParams(eventLotParamsSchema),
  validateBody(updateTicketLotBodySchema),
  (req, res) => void eventController.updateLot(req, res),
);

router.delete(
  "/:eventId/lots/:lotId",
  ...eventManagementMiddlewares,
  validateParams(eventLotParamsSchema),
  (req, res) => void eventController.deleteLot(req, res),
);

router.get(
  "/:eventId/check-in-staff",
  ...eventManagementMiddlewares,
  validateParams(eventIdParamsSchema),
  (req, res) => void eventController.listCheckInStaff(req, res),
);

router.post(
  "/:eventId/check-in-staff",
  ...eventManagementMiddlewares,
  validateParams(eventIdParamsSchema),
  validateBody(addCheckInStaffBodySchema),
  (req, res) => void eventController.addCheckInStaff(req, res),
);

router.delete(
  "/:eventId/check-in-staff/:userId",
  ...eventManagementMiddlewares,
  validateParams(eventStaffParamsSchema),
  (req, res) => void eventController.removeCheckInStaff(req, res),
);

export default router;
