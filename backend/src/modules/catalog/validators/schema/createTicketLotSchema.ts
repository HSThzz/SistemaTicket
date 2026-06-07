import { z } from "zod";

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
      .positive("Quantidade total deve ser positiva"),
    availableQuantity: z.coerce
      .number()
      .int("Quantidade disponível deve ser inteira")
      .nonnegative("Quantidade disponível não pode ser negativa")
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
