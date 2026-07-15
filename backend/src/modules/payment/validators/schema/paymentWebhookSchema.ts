import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const paymentWebhookSchema = z.object({
  event: z.enum(["payment.succeeded", "payment.failed", "payment.refunded"], {
    message: "Evento de webhook inválido",
  }),
  data: z.object({
    transactionId: z.string().trim().min(1, "transactionId é obrigatório"),
    orderId: uuidSchema,
    paidAt: z.string().optional(),
    failureReason: z.string().optional(),
  }),
});

export type PaymentWebhookInputSchema = z.infer<typeof paymentWebhookSchema>;
