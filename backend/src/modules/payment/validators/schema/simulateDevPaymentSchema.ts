import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const simulateDevPaymentSchema = z.object({
  orderId: uuidSchema,
  requesterUserId: uuidSchema,
});

export type SimulateDevPaymentInputSchema = z.infer<typeof simulateDevPaymentSchema>;
