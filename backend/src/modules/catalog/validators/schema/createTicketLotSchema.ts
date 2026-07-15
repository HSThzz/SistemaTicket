import { z } from "zod";

/** Limite superior de ingressos por lote (protege estoque Redis / abuso). */
export const MAX_TICKET_LOT_QUANTITY = 100_000;

export const createTicketLotSchema = z
  .object({
    name: z.string().trim().min(1, "Nome do lote é obrigatório").max(255),
    price: z.coerce
      .number({ message: "Preço deve ser numérico" })
      .int("Preço deve ser inteiro (centavos)")
      .nonnegative("Preço não pode ser negativo"),
    totalQuantity: z.coerce
      .number({ message: "Quantidade total deve ser numérica" })
      .int("Quantidade total deve ser inteira")
      .positive("Quantidade total deve ser positiva")
      .max(
        MAX_TICKET_LOT_QUANTITY,
        `Quantidade total máxima é ${MAX_TICKET_LOT_QUANTITY}`,
      ),
    availableQuantity: z.coerce
      .number()
      .int("Quantidade disponível deve ser inteira")
      .nonnegative("Quantidade disponível não pode ser negativa")
      .max(
        MAX_TICKET_LOT_QUANTITY,
        `Quantidade disponível máxima é ${MAX_TICKET_LOT_QUANTITY}`,
      )
      .optional(),
    /** `null`/omitido = sem limite; use `1` para 1 ingresso por CPF. */
    maxPerDocument: z
      .union([
        z.coerce.number().int().positive().max(10),
        z.null(),
      ])
      .optional(),
  })
  .refine(
    (data) =>
      data.availableQuantity === undefined ||
      data.availableQuantity <= data.totalQuantity,
    {
      message: "Quantidade disponível não pode ser maior que a total",
      path: ["availableQuantity"],
    },
  );

export type CreateTicketLotInputSchema = z.infer<typeof createTicketLotSchema>;
