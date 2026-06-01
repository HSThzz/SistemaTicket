/**
 * @file Controlador HTTP de registro, login e perfil.
 * @module modules/identity/interfaces/http/AuthController
 */

import type { Request, Response } from "express";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  AuthError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidRoleError,
  UserNotFoundError,
} from "../../domain/errors/AuthError";
import { UserRole } from "../../../../shared/kernel/enums";
import { AuthService } from "../../application/AuthService";

const CONTEXT = "AuthController";
const logger = Logger.getInstance();
const authService = new AuthService(AppDataSource);

/**
 * Adapta requisições HTTP para o `AuthService` e mapeia erros para status HTTP.
 */
export class AuthController {
  /**
   * POST /auth/register — cadastra novo usuário.
   * @param req - Corpo: name, email, password, document.
   * @param res - 201 com token e user ou erro de validação/domínio.
   * @returns Promise resolvida após enviar a resposta.
   */
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password, document } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      document?: string;
    };

    if (!name || !email || !password || !document) {
      res.status(400).json({
        error: "name, email, password and document are required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      const result = await authService.register({
        name,
        email,
        password,
        document,
      });

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
      const user = await authService.getProfile(req.user.id);
      res.status(200).json({ user });
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
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({
        error: "email and password are required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      const result = await authService.login({ email, password });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PATCH /auth/users/:userId/role — altera papel (somente ADMIN).
   * @param req - Parâmetro userId e corpo com role válido.
   * @param res - 200 com user atualizado ou erro.
   * @returns Promise resolvida após enviar a resposta.
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    const userIdParam = req.params.userId;
    const userId =
      typeof userIdParam === "string"
        ? userIdParam
        : Array.isArray(userIdParam)
          ? userIdParam[0]
          : "";

    const { role } = req.body as { role?: string };

    if (!userId) {
      res.status(400).json({ error: "userId is required", code: "VALIDATION_ERROR" });
      return;
    }

    if (!role || !(role in UserRole)) {
      res.status(400).json({ error: "Valid role is required", code: "VALIDATION_ERROR" });
      return;
    }

    try {
      const user = await authService.updateUserRole(
        userId,
        UserRole[role as keyof typeof UserRole],
      );
      res.status(200).json({ user });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /** Mapeia erros de domínio e inesperados para respostas JSON. */
  private handleError(res: Response, error: unknown): void {
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

    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof InvalidRoleError) {
      res.status(400).json({ error: error.message, code: error.code });
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
