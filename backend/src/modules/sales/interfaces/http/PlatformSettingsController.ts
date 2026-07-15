/**
 * @file Controlador HTTP de configurações da plataforma (taxa de serviço).
 * @module modules/sales/interfaces/http/PlatformSettingsController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import { getPlatformFeePercent } from "../../application/services/getPlatformFeePercent";
import { updatePlatformFeePercent } from "../../application/services/updatePlatformFeePercent";

const CONTEXT = "PlatformSettingsController";
const logger = Logger.getInstance();

export class PlatformSettingsController {
  /** GET /platform/fee — percentual vigente (público, para checkout/UI). */
  async getFee(_req: Request, res: Response): Promise<void> {
    try {
      const percent = await getPlatformFeePercent();
      res.status(200).json({ percent });
    } catch (error) {
      logger.error(CONTEXT, "Failed to get platform fee", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal error", code: "INTERNAL_ERROR" });
    }
  }

  /** PATCH /platform/fee — SUPER_ADMIN atualiza o percentual. */
  async updateFee(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const result = await updatePlatformFeePercent(req.body, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: error.message,
          code: error.code,
          field: error.issues[0]?.path || undefined,
        });
        return;
      }

      logger.error(CONTEXT, "Failed to update platform fee", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(400).json({ error: "Invalid payload", code: "VALIDATION_ERROR" });
    }
  }
}

export const platformSettingsController = new PlatformSettingsController();
