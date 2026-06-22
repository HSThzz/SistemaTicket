/**
 * @file Agregador de rotas HTTP da API (módulos e health).
 * @module shared/interfaces/http/routes
 */

import { Router } from "express";
import { healthController } from "../HealthController";
import authRoutes from "../../../../modules/identity/interfaces/http/auth.routes";
import eventRoutes from "../../../../modules/catalog/interfaces/http/event.routes";
import participationRoutes from "../../../../modules/participation/interfaces/http/participation.routes";
import orderRoutes from "../../../../modules/sales/interfaces/http/order.routes";
import paymentRoutes from "../../../../modules/payment/interfaces/http/payment.routes";
import purchaseRoutes from "../../../../modules/sales/interfaces/http/purchase.routes";
import ticketRoutes from "../../../../modules/ticketing/interfaces/http/ticket.routes";
import walletRoutes from "../../../../modules/ticketing/interfaces/http/wallet.routes";
import leadRoutes from "../../../../modules/leads/interfaces/http/lead.routes";
import spotifyRoutes from "../../../../modules/integrations/spotify/interfaces/http/spotify.routes";

const router = Router();

router.get("/health", (req, res) => void healthController.check(req, res));

router.use("/auth", authRoutes);
router.use("/auth/spotify", spotifyRoutes);
router.use("/events", eventRoutes);
router.use("/events", participationRoutes);
router.use("/orders", orderRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/payments", paymentRoutes);
router.use("/tickets", ticketRoutes);
router.use("/wallet", walletRoutes);
router.use("/leads", leadRoutes);

export default router;
