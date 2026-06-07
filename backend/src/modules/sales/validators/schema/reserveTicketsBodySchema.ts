import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

/** Payload HTTP de reserva (userId vem do token). */
export const reserveTicketsBodySchema = z.object({
  ticketLotId: uuidSchema,
  quantity: z
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser positiva")
    .max(20, "Máximo de 20 ingressos por reserva"),
});

export type ReserveTicketsBodyInputSchema = z.infer<typeof reserveTicketsBodySchema>;
