/**
 * @file Controlador HTTP de registro, login e perfil.
 * @module modules/identity/interfaces/http/AuthController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  AuthError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidCurrentPasswordError,
  InvalidRoleError,
  UserNotFoundError,
} from "../../domain/errors/AuthError";
import type { LoginInput, RegisterInput } from "../../application/types";
import { UserRole } from "../../../../shared/kernel/enums";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import { getProfile } from "../../application/services/getProfile";
import { loginUser } from "../../application/services/loginUser";
import { lookupUserByEmail } from "../../application/services/lookupUserByEmail";
import { registerUser } from "../../application/services/registerUser";
import { updatePassword as changeUserPassword } from "../../application/services/updatePassword";
import { updateProfile } from "../../application/services/updateProfile";
import { updateUserRole } from "../../application/services/updateUserRole";
import { addFavorite as addUserFavorite } from "../../application/services/addFavorite";
import { listFavoriteEventIds } from "../../application/services/listFavoriteEventIds";
import { listFavoriteEvents as listUserFavoriteEvents } from "../../application/services/listFavoriteEvents";
import { removeFavorite as removeUserFavorite } from "../../application/services/removeFavorite";
import { serializeEvent } from "../../../catalog/application/helpers/serializeEvent";
import { EventNotFoundError } from "../../../catalog/domain/errors/EventError";
import type { UpdatePasswordInputSchema } from "../../validators/schema/updatePasswordSchema";
import type { UpdateProfileInputSchema } from "../../validators/schema/updateProfileSchema";

const CONTEXT = "AuthController";
const logger = Logger.getInstance();

/**
 * Adapta requisições HTTP para os serviços de identidade e mapeia erros para status HTTP.
 */
export class AuthController {
  /**
   * POST /auth/register — cadastra novo usuário.
   * @param req - Corpo: name, email, password, document.
   * @param res - 201 com token e user ou erro de validação/domínio.
   * @returns Promise resolvida após enviar a resposta.
   */
  async register(req: Request, res: Response): Promise<void> {
    const body = req.body as RegisterInput;

    try {
      const result = await registerUser(body);
      res.status(201).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /auth/me — retorna perfil do usuário autenticado.
   * @param req - Requer `req.user` preenchido pelo middleware.
   * @param res - 200 com user ou 401/404.
   * @returns Promise resolvida após enviar a resposta.
   */
  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const user = await getProfile(req.user.id);
      res.status(200).json({ user });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PATCH /auth/me — atualiza nome, e-mail e documento do usuário autenticado.
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const body = req.body as UpdateProfileInputSchema;

    try {
      const user = await updateProfile(req.user.id, body);
      res.status(200).json({ user });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PATCH /auth/me/password — altera a senha do usuário autenticado.
   */
  async updatePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const body = req.body as UpdatePasswordInputSchema;

    try {
      await changeUserPassword(req.user.id, body);
      res.status(200).json({ success: true });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /auth/me/favorites — lista IDs dos eventos favoritos do usuário.
   */
  async listFavorites(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const eventIds = await listFavoriteEventIds(req.user.id);
      res.status(200).json({ eventIds });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /auth/me/favorites/events — lista eventos publicados favoritados.
   */
  async listFavoriteEvents(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const events = await listUserFavoriteEvents(req.user.id);
      res.status(200).json({
        events: events.map((event) => serializeEvent(event)),
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /auth/me/favorites/:eventId — adiciona evento aos favoritos.
   */
  async addFavorite(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { eventId } = req.params as { eventId: string };

    try {
      const result = await addUserFavorite(req.user.id, eventId);
      res.status(result.created ? 201 : 200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * DELETE /auth/me/favorites/:eventId — remove evento dos favoritos.
   */
  async removeFavorite(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { eventId } = req.params as { eventId: string };

    try {
      const result = await removeUserFavorite(req.user.id, eventId);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /auth/login — autentica por email e senha.
   * @param req - Corpo: email, password.
   * @param res - 200 com token e user ou 401.
   * @returns Promise resolvida após enviar a resposta.
   */
  async login(req: Request, res: Response): Promise<void> {
    const body = req.body as LoginInput;

    try {
      const result = await loginUser(body);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /auth/users/lookup?email= — busca usuário por e-mail (ADMIN).
   */
  async lookupUser(req: Request, res: Response): Promise<void> {
    const { email } = req.query as { email: string };

    try {
      const user = await lookupUserByEmail({ email });
      res.status(200).json({ user });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PATCH /auth/users/:userId/role — altera papel (somente ADMIN).
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    const { role } = req.body as { role: UserRole };

    try {
      const user = await updateUserRole(userId, { role });
      res.status(200).json({ user });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /** Mapeia erros de domínio e inesperados para respostas JSON. */
  private handleError(res: Response, error: unknown): void {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        field: error.issues[0]?.path || undefined,
      });
      return;
    }

    if (error instanceof EmailAlreadyExistsError) {
      logger.warn(CONTEXT, "Registration failed", {
        code: error.code,
        error: error.message,
      });
      res.status(409).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof InvalidCurrentPasswordError) {
      res.status(401).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof InvalidRoleError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof EventNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof AuthError) {
      logger.error(CONTEXT, "Authentication error", {
        code: error.code,
        error: error.message,
      });
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, "Unexpected authentication error", {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}

/** Instância singleton do controlador de autenticação. */
export const authController = new AuthController();
