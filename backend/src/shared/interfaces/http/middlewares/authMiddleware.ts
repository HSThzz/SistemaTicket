/**
 * @file Middleware de autenticação JWT (Bearer).
 * @module shared/interfaces/http/middlewares/authMiddleware
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { isAuthTokenDenylisted } from "../../../../modules/identity/application/helpers/authTokenDenylist";
import { isAuthTokenRevoked } from "../../../../modules/identity/application/helpers/authToken";
import type { AuthTokenPayload } from "../../../../modules/identity/application/types";
import { findUserAuthStateById } from "../../../../modules/identity/application/queries/findUserAuthStateById";
import { UnauthorizedError } from "../../../../modules/identity/domain/errors/AuthError";
import { env } from "../../../infrastructure/config/env";

/**
 * Valida o header Authorization Bearer, verifica o JWT e preenche `req.user`.
 * A role sempre vem do banco (não do token), para refletir mudanças imediatas.
 * @param req - Requisição Express.
 * @param res - Resposta Express.
 * @param next - Próximo middleware.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
    const decoded = jwt.verify(token, env.jwt.secret) as AuthTokenPayload & {
      exp?: number;
    };

    if (!decoded.userId || !decoded.role) {
      throw new UnauthorizedError("Invalid token payload");
    }

    if (decoded.jti && (await isAuthTokenDenylisted(decoded.jti))) {
      res.status(401).json({
        error: "Session expired. Please sign in again.",
        code: "TOKEN_REVOKED",
      });
      return;
    }

    const authState = await findUserAuthStateById(decoded.userId);

    if (!authState) {
      res.status(401).json({
        error: "Invalid or expired token",
        code: new UnauthorizedError().code,
      });
      return;
    }

    if (isAuthTokenRevoked(decoded.pwdAt, authState.passwordChangedAt)) {
      res.status(401).json({
        error: "Session expired. Please sign in again.",
        code: "TOKEN_REVOKED",
      });
      return;
    }

    req.user = {
      id: decoded.userId,
      role: authState.role,
      jti: decoded.jti,
      tokenExp: decoded.exp,
    };

    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired token",
      code: new UnauthorizedError().code,
    });
  }
}
