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

const router = Router();

router.post("/register", (req, res) => void authController.register(req, res));
router.post(
  "/login",
  authLoginRateLimiter,
  (req, res) => void authController.login(req, res),
);
router.get("/me", authMiddleware, (req, res) => void authController.me(req, res));

router.patch(
  "/users/:userId/role",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  (req, res) => void authController.updateUserRole(req, res),
);

export default router;
