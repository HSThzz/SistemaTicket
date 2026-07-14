import { z } from "zod";
import { MAX_TICKET_LOT_QUANTITY } from "./createTicketLotSchema";

/** Atualização parcial de lote — pelo menos um campo obrigatório. */
export const updateTicketLotSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome do lote é obrigatório")
      .max(255)
      .optional(),
    price: z.coerce
      .number({ message: "Preço deve ser numérico" })
      .int("Preço deve ser inteiro (centavos)")
      .nonnegative("Preço não pode ser negativo")
      .optional(),
    totalQuantity: z.coerce
      .number({ message: "Quantidade total deve ser numérica" })
      .int("Quantidade total deve ser inteira")
      .positive("Quantidade total deve ser positiva")
      .max(
        MAX_TICKET_LOT_QUANTITY,
        `Quantidade total máxima é ${MAX_TICKET_LOT_QUANTITY}`,
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.price !== undefined ||
      data.totalQuantity !== undefined,
    {
      message: "Informe ao menos um campo para atualizar",
    },
  );

export type UpdateTicketLotInputSchema = z.infer<typeof updateTicketLotSchema>;
