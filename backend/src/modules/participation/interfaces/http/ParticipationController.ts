/**
 * @file Controlador HTTP de solicitações de participação em eventos privados.
 * @module modules/participation/interfaces/http/ParticipationController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ParticipationRequestStatus, UserRole } from "../../../../shared/kernel/enums";
import { STAFF_ROLES } from "../../../../shared/kernel/staffRoles";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { optionalAuthMiddleware } from "../../../../shared/interfaces/http/middlewares/optionalAuthMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import {
  ParticipationAccessDeniedError,
  ParticipationAlreadyRequestedError,
  ParticipationAlreadyReviewedError,
  ParticipationError,
  ParticipationEventNotFoundError,
  ParticipationNotPrivateEventError,
  ParticipationRequestNotFoundError,
} from "../../domain/errors/ParticipationError";
import { serializeParticipationRequest } from "../../application/helpers/serializeParticipationRequest";
import { listParticipationRequests } from "../../application/services/listParticipationRequests";
import { reviewParticipationRequest } from "../../application/services/reviewParticipationRequest";
import { submitParticipationRequest } from "../../application/services/submitParticipationRequest";
import type { ParticipationActor } from "../../application/types";

const CONTEXT = "ParticipationController";
const logger = Logger.getInstance();

/**
 * Obtém ator autenticado da requisição ou responde 401.
 */
function requireActor(req: Request, res: Response): ParticipationActor | null {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    return null;
  }

  return { userId: req.user.id, role: req.user.role };
}

/**
 * Endpoints de solicitação (usuário) e gestão (produtor) de participação.
 */
export class ParticipationController {
  /**
   * POST /events/:eventId/participation-requests — usuário solicita participação.
   * Aceita autenticação opcional: vincula `userId` se houver token válido.
   */
  async submit(req: Request, res: Response): Promise<void> {
    const { eventId } = req.params as { eventId: string };

    try {
      const created = await submitParticipationRequest(
        eventId,
        req.body,
        { userId: req.user?.id ?? null },
      );

      res.status(201).json({
        participationRequest: serializeParticipationRequest(created),
        message:
          "Solicitação enviada! Você será avisado quando o produtor responder.",
      });
    } catch (error) {
      this.handleError(res, error, "submit", { eventId });
    }
  }

  /**
   * GET /events/:eventId/participation-requests — produtor lista solicitações por status.
   */
  async list(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId } = req.params as { eventId: string };
    const { status } = req.query as { status: ParticipationRequestStatus };

    try {
      const requests = await listParticipationRequests(eventId, status, actor);
      res.status(200).json({
        participationRequests: requests.map((request) =>
          serializeParticipationRequest(request),
        ),
      });
    } catch (error) {
      this.handleError(res, error, "list", { eventId });
    }
  }

  /**
   * PATCH /events/:eventId/participation-requests/:requestId — produtor aprova/recusa.
   */
  async review(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId, requestId } = req.params as {
      eventId: string;
      requestId: string;
    };

    try {
      const updated = await reviewParticipationRequest(
        eventId,
        requestId,
        req.body,
        actor,
      );

      res.status(200).json({
        participationRequest: serializeParticipationRequest(updated),
      });
    } catch (error) {
      this.handleError(res, error, "review", { eventId, requestId });
    }
  }

  /** Mapeia erros de participação para status HTTP e log. */
  private handleError(
    res: Response,
    error: unknown,
    action: string,
    context: Record<string, unknown> = {},
  ): void {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        field: error.issues[0]?.path || undefined,
      });
      return;
    }

    if (
      error instanceof ParticipationEventNotFoundError ||
      error instanceof ParticipationRequestNotFoundError
    ) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof ParticipationAccessDeniedError) {
      res.status(403).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof ParticipationAlreadyRequestedError) {
      res.status(409).json({ error: error.message, code: error.code });
      return;
    }

    if (
      error instanceof ParticipationNotPrivateEventError ||
      error instanceof ParticipationAlreadyReviewedError
    ) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof ParticipationError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, `Failed to ${action} participation request`, {
      ...context,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(400).json({ error: "Invalid payload", code: "VALIDATION_ERROR" });
  }
}

/** Instância singleton do controlador de participação. */
export const participationController = new ParticipationController();

/** Middlewares de gestão (auth + produtor ou equipe admin). */
export const participationManagementMiddlewares = [
  authMiddleware,
  roleMiddleware([...STAFF_ROLES, UserRole.PRODUCER]),
] as const;

/** Middleware de submissão (autenticação opcional). */
export const participationSubmitMiddlewares = [optionalAuthMiddleware] as const;
