/**
 * @file Middleware de autenticação opcional (Bearer): preenche `req.user` se houver token válido, sem bloquear.
 * @module shared/interfaces/http/middlewares/optionalAuthMiddleware
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { isAuthTokenDenylisted } from "../../../../modules/identity/application/helpers/authTokenDenylist";
import { isAuthTokenRevoked } from "../../../../modules/identity/application/helpers/authToken";
import type { AuthTokenPayload } from "../../../../modules/identity/application/types";
import { findUserAuthStateById } from "../../../../modules/identity/application/queries/findUserAuthStateById";
import { env } from "../../../infrastructure/config/env";

/**
 * Tenta autenticar via header Authorization Bearer. Se o token for válido, preenche `req.user`;
 * caso contrário, segue adiante anonimamente (sem responder 401).
 * A role sempre vem do banco (não do token).
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
    const decoded = jwt.verify(token, env.jwt.secret) as AuthTokenPayload & {
      exp?: number;
    };

    if (!decoded.userId || !decoded.role) {
      next();
      return;
    }

    if (decoded.jti && (await isAuthTokenDenylisted(decoded.jti))) {
      next();
      return;
    }

    const authState = await findUserAuthStateById(decoded.userId);

    if (
      !authState ||
      isAuthTokenRevoked(decoded.pwdAt, authState.passwordChangedAt)
    ) {
      next();
      return;
    }

    req.user = {
      id: decoded.userId,
      role: authState.role,
      jti: decoded.jti,
      tokenExp: decoded.exp,
    };
  } catch {
    // Token inválido/expirado em rota opcional: prossegue como anônimo.
  }

  next();
}
