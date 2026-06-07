/**
 * @file Schemas Zod para rotas HTTP de pagamento (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/payment.schemas
 */

import { simulateDevPaymentSchema } from "../../../../modules/payment/validators/schema/simulateDevPaymentSchema";
import { paymentWebhookSchema } from "../../../../modules/payment/validators/schema/paymentWebhookSchema";

export const simulateDevPaymentBodySchema = simulateDevPaymentSchema.pick({
  orderId: true,
});

export const internalWebhookBodySchema = paymentWebhookSchema;
