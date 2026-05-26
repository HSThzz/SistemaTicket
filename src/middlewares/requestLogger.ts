import type { NextFunction, Request, Response } from "express";
import { Logger } from "../config/logger";

const logger = Logger.getInstance();
const CONTEXT = "HTTP";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    logger.info(CONTEXT, "Request completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
    });
  });

  next();
}
