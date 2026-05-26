import { Router } from "express";
import { paymentController } from "../controllers/PaymentController";

const router = Router();

router.post("/webhook", (req, res) => void paymentController.webhook(req, res));

export default router;
