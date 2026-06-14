import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

/** Schema para geração sob demanda de cobrança PIX de um pedido pendente. */
export const createPixPaymentSchema = z.object({
  orderId: uuidSchema,
  requesterUserId: uuidSchema,
});

export type CreatePixPaymentInputSchema = z.infer<typeof createPixPaymentSchema>;
