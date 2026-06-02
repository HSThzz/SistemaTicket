/**
 * @file Schemas Zod para rotas de ingressos e check-in.
 * @module shared/interfaces/http/validation/ticketing.schemas
 */

import { z } from "zod";

/** Corpo de check-in na portaria. */
export const checkInBodySchema = z.object({
  unique_code: z.string().trim().min(1, "Código do ingresso é obrigatório").max(128),
});
