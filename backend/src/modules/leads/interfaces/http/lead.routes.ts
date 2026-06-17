/**
 * @file Rotas HTTP de captura de leads de produtores.
 * @module modules/leads/interfaces/http/lead.routes
 */

import { Router } from "express";
import { contactFormRateLimiter } from "../../../../shared/interfaces/http/middlewares/rateLimiter";
import { validateBody } from "../../../../shared/interfaces/http/middlewares/validate";
import { producerLeadSchema } from "../../validators/schema/producerLeadSchema";
import { leadController } from "./LeadController";

const router = Router();

router.post(
  "/producer-contact",
  contactFormRateLimiter,
  validateBody(producerLeadSchema),
  (req, res) => void leadController.submitProducerContact(req, res),
);

export default router;
