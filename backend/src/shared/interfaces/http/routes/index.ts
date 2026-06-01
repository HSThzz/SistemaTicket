import { Router } from "express";
import { healthController } from "../HealthController";
import authRoutes from "../../../../modules/identity/interfaces/http/auth.routes";
import eventRoutes from "../../../../modules/catalog/interfaces/http/event.routes";
import orderRoutes from "../../../../modules/sales/interfaces/http/order.routes";
import paymentRoutes from "../../../../modules/payment/interfaces/http/payment.routes";
import purchaseRoutes from "../../../../modules/sales/interfaces/http/purchase.routes";
import ticketRoutes from "../../../../modules/ticketing/interfaces/http/ticket.routes";
import walletRoutes from "../../../../modules/ticketing/interfaces/http/wallet.routes";

const router = Router();

router.get("/health", (req, res) => void healthController.check(req, res));

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/orders", orderRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/payments", paymentRoutes);
router.use("/tickets", ticketRoutes);
router.use("/wallet", walletRoutes);

export default router;
