/**
 * @file Middleware de autenticação JWT (Bearer).
 * @module shared/interfaces/http/middlewares/authMiddleware
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../../infrastructure/config/env";
import type { UserRole } from "../../../kernel/enums";
import { UnauthorizedError } from "../../../../modules/identity/domain/errors/AuthError";
import type { AuthTokenPayload } from "../../../../modules/identity/application/types";

/**
 * Valida o header Authorization Bearer, verifica o JWT e preenche `req.user`.
 * @param req - Requisição Express.
 * @param res - Resposta Express.
 * @param next - Próximo middleware.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Missing or invalid Authorization header",
      code: new UnauthorizedError().code,
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as AuthTokenPayload;

    if (!decoded.userId || !decoded.role) {
      throw new UnauthorizedError("Invalid token payload");
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role as UserRole,
    };

    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired token",
      code: new UnauthorizedError().code,
    });
  }
}
