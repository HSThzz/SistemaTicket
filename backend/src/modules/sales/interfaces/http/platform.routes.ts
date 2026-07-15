/**
 * @file Rotas HTTP de configurações da plataforma (`/platform`).
 * @module modules/sales/interfaces/http/platform.routes
 */

import { Router } from "express";
import { platformSettingsController } from "./PlatformSettingsController";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { UserRole } from "../../../../shared/kernel/enums";
import { validateBody } from "../../../../shared/interfaces/http/middlewares/validate";
import { updatePlatformFeeBodySchema } from "../../../../shared/interfaces/http/validation/sales.schemas";

const router = Router();

router.get("/fee", (req, res) => void platformSettingsController.getFee(req, res));

router.patch(
  "/fee",
  authMiddleware,
  roleMiddleware([UserRole.SUPER_ADMIN]),
  validateBody(updatePlatformFeeBodySchema),
  (req, res) => void platformSettingsController.updateFee(req, res),
);

export default router;
