import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../../../../modules/identity/domain/errors/AuthError";

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
