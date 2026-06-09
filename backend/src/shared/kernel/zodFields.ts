/**
 * @file Campos Zod reutilizáveis entre domínios.
 * @module shared/kernel/zodFields
 */

import { z } from "zod";

/** String de data/hora parseável por `Date`. */
export const dateStringSchema = z
  .string()
  .trim()
  .min(1, "Data é obrigatória")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Data inválida");

/** UUID genérico. */
export const uuidSchema = z.uuid("ID inválido");

/** URL de imagem opcional (aceita vazio ou null). */
export const optionalImageUrlSchema = z
  .union([z.url("URL de imagem inválida"), z.literal(""), z.null()])
  .optional();
