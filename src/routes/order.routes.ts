import { Router } from "express";
import { orderController } from "../controllers/OrderController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/me", authMiddleware, (req, res) => void orderController.listMine(req, res));

export default router;

