/**
 * @file Rotas HTTP de autenticação e gestão de papéis.
 * @module modules/identity/interfaces/http/auth.routes
 */

import { Router } from "express";
import { authController } from "./AuthController";
import { UserRole } from "../../../../shared/kernel/enums";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { authLoginRateLimiter } from "../../../../shared/interfaces/http/middlewares/rateLimiter";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { validateBody, validateParams, validateQuery } from "../../../../shared/interfaces/http/middlewares/validate";
import {
  loginBodySchema,
  lookupUserQuerySchema,
  registerBodySchema,
  updateRoleBodySchema,
  userIdParamsSchema,
} from "../../../../shared/interfaces/http/validation/identity.schemas";

const router = Router();

router.post(
  "/register",
  validateBody(registerBodySchema),
  (req, res) => void authController.register(req, res),
);

router.post(
  "/login",
  authLoginRateLimiter,
  validateBody(loginBodySchema),
  (req, res) => void authController.login(req, res),
);

router.get("/me", authMiddleware, (req, res) => void authController.me(req, res));

router.get(
  "/users/lookup",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  validateQuery(lookupUserQuerySchema),
  (req, res) => void authController.lookupUser(req, res),
);

router.patch(
  "/users/:userId/role",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  validateParams(userIdParamsSchema),
  validateBody(updateRoleBodySchema),
  (req, res) => void authController.updateUserRole(req, res),
);

export default router;
