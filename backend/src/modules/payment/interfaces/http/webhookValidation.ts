/**
 * @file Middleware de validação condicional para webhook interno vs Mercado Pago.
 * @module payment/interfaces/http/webhookValidation
 */

import type { NextFunction, Request, Response } from "express";
import { validateBody } from "../../../../shared/interfaces/http/middlewares/validate";
import { internalWebhookBodySchema } from "../../../../shared/interfaces/http/validation/payment.schemas";
import { isMercadoPagoWebhookRequest } from "../../infrastructure/gateways/mercadoPagoWebhook";

const validateInternalBody = validateBody(internalWebhookBodySchema);

/**
 * Valida payload do webhook simulado; ignora requisições do Mercado Pago.
 */
export function validatePaymentWebhookBody(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isMercadoPagoWebhookRequest(req)) {
    next();
    return;
  }

  validateInternalBody(req, res, next);
}
