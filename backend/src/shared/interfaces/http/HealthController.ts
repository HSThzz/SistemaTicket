import type { Request, Response } from "express";
import { AppDataSource } from "../../infrastructure/config/data-source";
import { Logger } from "../../infrastructure/config/logger";
import { getRedis } from "../../infrastructure/config/redis";
import { HealthService } from "../../application/HealthService";

const CONTEXT = "HealthController";
const logger = Logger.getInstance();
const healthService = new HealthService(AppDataSource, getRedis());

export class HealthController {
  async check(_req: Request, res: Response): Promise<void> {
    try {
      const report = await healthService.check();
      const httpStatus = report.status === "down" ? 503 : 200;
      res.status(httpStatus).json(report);
    } catch (error) {
      logger.error(CONTEXT, "Health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(503).json({
        status: "down",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        code: "HEALTH_CHECK_FAILED",
      });
    }
  }
}

export const healthController = new HealthController();
