/**
 * @file Schemas Zod para rotas HTTP de pagamento (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/payment.schemas
 */

import { simulateDevPaymentSchema } from "../../../../modules/payment/validators/schema/simulateDevPaymentSchema";
import { paymentWebhookSchema } from "../../../../modules/payment/validators/schema/paymentWebhookSchema";
import { createCardPaymentSchema } from "../../../../modules/payment/validators/schema/createCardPaymentSchema";
import { createPixPaymentSchema } from "../../../../modules/payment/validators/schema/createPixPaymentSchema";

export const simulateDevPaymentBodySchema = simulateDevPaymentSchema.pick({
  orderId: true,
});

/** Corpo aceito em `POST /payments/card` (sem `requesterUserId`, derivado do token). */
export const createCardPaymentBodySchema = createCardPaymentSchema.omit({
  requesterUserId: true,
});

/** Corpo aceito em `POST /payments/pix` (sem `requesterUserId`, derivado do token). */
export const createPixPaymentBodySchema = createPixPaymentSchema.pick({
  orderId: true,
});

export const internalWebhookBodySchema = paymentWebhookSchema;
