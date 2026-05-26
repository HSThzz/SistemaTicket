import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Logger } from "../config/logger";
import {
  AuthError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
} from "../errors/AuthError";
import { AuthService } from "../services/AuthService";

const CONTEXT = "AuthController";
const logger = Logger.getInstance();
const authService = new AuthService(AppDataSource);

export class AuthController {
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

export const authController = new AuthController();
