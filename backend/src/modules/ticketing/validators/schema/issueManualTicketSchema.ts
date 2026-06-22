import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const issueManualTicketSchema = z.object({
  userId: uuidSchema,
  ticketLotId: uuidSchema,
  quantity: z
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser positiva")
    .max(20, "Máximo de 20 ingressos por emissão"),
  sendEmail: z.boolean().default(true),
  reason: z.string().trim().max(500).optional(),
});

export type IssueManualTicketInputSchema = z.infer<typeof issueManualTicketSchema>;
