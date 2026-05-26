import { Router } from "express";
import { authController } from "../controllers/AuthController";
import { authLoginRateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post("/register", (req, res) => void authController.register(req, res));
router.post(
  "/login",
  authLoginRateLimiter,
  (req, res) => void authController.login(req, res),
);

export default router;
