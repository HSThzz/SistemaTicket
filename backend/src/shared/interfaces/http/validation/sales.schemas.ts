/**
 * @file Schemas Zod para rotas de vendas e pedidos.
 * @module shared/interfaces/http/validation/sales.schemas
 */

import { z } from "zod";

/** Corpo de reserva de ingressos. */
export const reserveBodySchema = z.object({
  ticketLotId: z.string().uuid("ID do lote inválido"),
  quantity: z
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser positiva")
    .max(20, "Máximo de 20 ingressos por reserva"),
});

/** Parâmetro UUID de pedido. */
export const orderIdParamsSchema = z.object({
  id: z.string().uuid("ID do pedido inválido"),
});
