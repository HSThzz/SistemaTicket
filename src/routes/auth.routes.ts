import { Router } from "express";
import { authController } from "../controllers/AuthController";
import { UserRole } from "../entities/enums";
import { authMiddleware } from "../middlewares/authMiddleware";
import { authLoginRateLimiter } from "../middlewares/rateLimiter";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = Router();

router.post("/register", (req, res) => void authController.register(req, res));
router.post(
  "/login",
  authLoginRateLimiter,
  (req, res) => void authController.login(req, res),
);

router.patch(
  "/users/:userId/role",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  (req, res) => void authController.updateUserRole(req, res),
);

export default router;
