import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const reserveTicketsSchema = z.object({
  userId: uuidSchema,
  ticketLotId: uuidSchema,
  quantity: z
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser positiva")
    .max(20, "Máximo de 20 ingressos por reserva"),
});

export type ReserveTicketsInputSchema = z.infer<typeof reserveTicketsSchema>;
