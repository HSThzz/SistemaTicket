/**
 * @file Rotas HTTP de solicitações de participação (montadas em `/events`).
 * @module modules/participation/interfaces/http/participation.routes
 */

import { Router } from "express";
import {
  participationController,
  participationManagementMiddlewares,
  participationSubmitMiddlewares,
} from "./ParticipationController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../../shared/interfaces/http/middlewares/validate";
import {
  listParticipationRequestsQuerySchema,
  participationEventIdParamsSchema,
  participationEventRequestParamsSchema,
  reviewParticipationRequestBodySchema,
  submitParticipationRequestBodySchema,
} from "../../../../shared/interfaces/http/validation/participation.schemas";

const router = Router();

router.get(
  "/participation-requests/mine",
  authMiddleware,
  (req, res) => void participationController.listMine(req, res),
);

router.post(
  "/:eventId/participation-requests",
  ...participationSubmitMiddlewares,
  validateParams(participationEventIdParamsSchema),
  validateBody(submitParticipationRequestBodySchema),
  (req, res) => void participationController.submit(req, res),
);

router.get(
  "/:eventId/participation-requests/me",
  authMiddleware,
  validateParams(participationEventIdParamsSchema),
  (req, res) => void participationController.mine(req, res),
);

router.get(
  "/:eventId/participation-requests",
  ...participationManagementMiddlewares,
  validateParams(participationEventIdParamsSchema),
  validateQuery(listParticipationRequestsQuerySchema),
  (req, res) => void participationController.list(req, res),
);

router.get(
  "/:eventId/paid-participants",
  ...participationManagementMiddlewares,
  validateParams(participationEventIdParamsSchema),
  (req, res) => void participationController.listPaid(req, res),
);

router.patch(
  "/:eventId/participation-requests/:requestId",
  ...participationManagementMiddlewares,
  validateParams(participationEventRequestParamsSchema),
  validateBody(reviewParticipationRequestBodySchema),
  (req, res) => void participationController.review(req, res),
);

export default router;
