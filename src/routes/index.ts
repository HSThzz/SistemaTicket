import { Router } from "express";
import authRoutes from "./auth.routes";
import eventRoutes from "./event.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";
import purchaseRoutes from "./purchase.routes";
import ticketRoutes from "./ticket.routes";
import walletRoutes from "./wallet.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/orders", orderRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/payments", paymentRoutes);
router.use("/tickets", ticketRoutes);
router.use("/wallet", walletRoutes);

export default router;
