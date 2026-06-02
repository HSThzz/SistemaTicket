/**
 * @file Schemas Zod para rotas de catálogo (eventos e lotes).
 * @module shared/interfaces/http/validation/catalog.schemas
 */

import { z } from "zod";
import { EventStatus } from "../../../kernel/enums";

/** Parâmetro UUID de evento. */
export const eventIdParamsSchema = z.object({
  eventId: z.string().uuid("ID do evento inválido"),
});

/** Corpo de criação de evento. */
export const createEventBodySchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(255),
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  date: z.string().trim().min(1, "Data é obrigatória"),
  location: z.string().trim().min(1, "Local é obrigatório"),
  imageUrl: z
    .union([z.string().url("URL de imagem inválida"), z.literal(""), z.null()])
    .optional(),
  status: z.nativeEnum(EventStatus, { message: "Status inválido" }).optional(),
});

/** Corpo parcial de atualização de evento. */
export const updateEventBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).optional(),
    date: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).optional(),
    imageUrl: z
      .union([z.string().url("URL de imagem inválida"), z.literal(""), z.null()])
      .optional(),
    status: z.nativeEnum(EventStatus, { message: "Status inválido" }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

/** Corpo de criação de lote de ingressos. */
export const createTicketLotBodySchema = z.object({
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
});
