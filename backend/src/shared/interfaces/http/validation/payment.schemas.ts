/**
 * @file Schemas Zod para rotas de pagamento.
 * @module shared/interfaces/http/validation/payment.schemas
 */

import { z } from "zod";

/** Corpo de simulação de pagamento em desenvolvimento. */
export const simulateDevPaymentBodySchema = z.object({
  orderId: z.string().uuid("ID do pedido inválido"),
});

/** Payload de webhook interno (gateway simulado). */
export const internalWebhookBodySchema = z.object({
  event: z.enum(["payment.succeeded", "payment.failed"], {
    message: "Evento de webhook inválido",
  }),
  data: z.object({
    transactionId: z.string().trim().min(1, "transactionId é obrigatório"),
    orderId: z.string().uuid("ID do pedido inválido"),
    paidAt: z.string().optional(),
    failureReason: z.string().optional(),
  }),
});
