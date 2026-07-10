/**
 * @file Middleware de autenticação opcional (Bearer): preenche `req.user` se houver token válido, sem bloquear.
 * @module shared/interfaces/http/middlewares/optionalAuthMiddleware
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { isAuthTokenRevoked } from "../../../../modules/identity/application/helpers/authToken";
import type { AuthTokenPayload } from "../../../../modules/identity/application/types";
import { findUserPasswordChangedAtById } from "../../../../modules/identity/application/queries/findUserPasswordChangedAtById";
import { env } from "../../../infrastructure/config/env";
import type { UserRole } from "../../../kernel/enums";

/**
 * Tenta autenticar via header Authorization Bearer. Se o token for válido, preenche `req.user`;
 * caso contrário, segue adiante anonimamente (sem responder 401).
 * @param req - Requisição Express.
 * @param _res - Resposta Express (não utilizada).
 * @param next - Próximo middleware.
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as AuthTokenPayload;

    if (!decoded.userId || !decoded.role) {
      next();
      return;
    }

    const passwordChangedAt = await findUserPasswordChangedAtById(decoded.userId);

    if (
      passwordChangedAt === undefined ||
      isAuthTokenRevoked(decoded.pwdAt, passwordChangedAt)
    ) {
      next();
      return;
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role as UserRole,
    };
  } catch {
    // Token inválido/expirado em rota opcional: prossegue como anônimo.
  }

  next();
}
