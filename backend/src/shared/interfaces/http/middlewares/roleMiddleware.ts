/**
 * @file Middleware de autorização por papel (role).
 * @module shared/interfaces/http/middlewares/roleMiddleware
 */

import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../../../../modules/identity/domain/errors/AuthError";

/**
 * Cria middleware que exige um dos papéis informados em `req.user.role`.
 * @param allowedRoles - Lista de papéis permitidos (valores de `UserRole`).
 * @returns Função middleware Express.
 */
export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        code: new UnauthorizedError().code,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Insufficient permissions",
        code: new ForbiddenError().code,
      });
      return;
    }

    next();
  };
}
