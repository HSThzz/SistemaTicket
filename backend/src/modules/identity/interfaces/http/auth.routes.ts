/**
 * @file Rotas HTTP de autenticação e gestão de papéis.
 * @module modules/identity/interfaces/http/auth.routes
 */

import { Router } from "express";
import { authController } from "./AuthController";
import { UserRole } from "../../../../shared/kernel/enums";
import { STAFF_ROLES } from "../../../../shared/kernel/staffRoles";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import {
  authLoginRateLimiter,
  authRegisterRateLimiter,
  authAdminPasswordResetRateLimiter,
  authForgotPasswordRateLimiter,
  authPasswordChangeRateLimiter,
  authResetPasswordRateLimiter,
} from "../../../../shared/interfaces/http/middlewares/rateLimiter";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { validateBody, validateParams, validateQuery } from "../../../../shared/interfaces/http/middlewares/validate";
import {
  listAdminAuditLogsQuerySchema,
  loginBodySchema,
  forgotPasswordBodySchema,
  adminResetUserPasswordBodySchema,
  lookupUserQuerySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  updatePasswordBodySchema,
  updateProfileBodySchema,
  updateRoleBodySchema,
  userIdParamsSchema,
  eventIdParamsSchema,
} from "../../../../shared/interfaces/http/validation/identity.schemas";

const router = Router();

router.post(
  "/register",
  authRegisterRateLimiter,
  validateBody(registerBodySchema),
  (req, res) => void authController.register(req, res),
);

router.post(
  "/login",
  authLoginRateLimiter,
  validateBody(loginBodySchema),
  (req, res) => void authController.login(req, res),
);

router.post(
  "/forgot-password",
  authForgotPasswordRateLimiter,
  validateBody(forgotPasswordBodySchema),
  (req, res) => void authController.forgotPassword(req, res),
);

router.post(
  "/reset-password",
  authResetPasswordRateLimiter,
  validateBody(resetPasswordBodySchema),
  (req, res) => void authController.resetPassword(req, res),
);

router.post("/logout", authMiddleware, (req, res) => void authController.logout(req, res));

router.get("/me", authMiddleware, (req, res) => void authController.me(req, res));

router.patch(
  "/me",
  authMiddleware,
  validateBody(updateProfileBodySchema),
  (req, res) => void authController.updateMe(req, res),
);

router.patch(
  "/me/password",
  authMiddleware,
  authPasswordChangeRateLimiter,
  validateBody(updatePasswordBodySchema),
  (req, res) => void authController.updatePassword(req, res),
);

router.get(
  "/me/favorites/events",
  authMiddleware,
  (req, res) => void authController.listFavoriteEvents(req, res),
);

router.get(
  "/me/favorites",
  authMiddleware,
  (req, res) => void authController.listFavorites(req, res),
);

router.post(
  "/me/favorites/:eventId",
  authMiddleware,
  validateParams(eventIdParamsSchema),
  (req, res) => void authController.addFavorite(req, res),
);

router.delete(
  "/me/favorites/:eventId",
  authMiddleware,
  validateParams(eventIdParamsSchema),
  (req, res) => void authController.removeFavorite(req, res),
);

router.get(
  "/users/lookup",
  authMiddleware,
  roleMiddleware([...STAFF_ROLES]),
  validateQuery(lookupUserQuerySchema),
  (req, res) => void authController.lookupUser(req, res),
);

router.patch(
  "/users/:userId/role",
  authMiddleware,
  roleMiddleware([UserRole.SUPER_ADMIN]),
  validateParams(userIdParamsSchema),
  validateBody(updateRoleBodySchema),
  (req, res) => void authController.updateUserRole(req, res),
);

router.patch(
  "/users/:userId/password",
  authMiddleware,
  roleMiddleware([...STAFF_ROLES]),
  authAdminPasswordResetRateLimiter,
  validateParams(userIdParamsSchema),
  validateBody(adminResetUserPasswordBodySchema),
  (req, res) => void authController.adminResetUserPassword(req, res),
);

router.get(
  "/admin/audit-logs",
  authMiddleware,
  roleMiddleware([UserRole.SUPER_ADMIN]),
  validateQuery(listAdminAuditLogsQuerySchema),
  (req, res) => void authController.listAdminAuditLogs(req, res),
);

export default router;
