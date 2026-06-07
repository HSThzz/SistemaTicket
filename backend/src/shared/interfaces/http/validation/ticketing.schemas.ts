/**
 * @file Schemas Zod para rotas HTTP de ingressos (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/ticketing.schemas
 */

import { z } from "zod";
import { checkInSchema } from "../../../../modules/ticketing/validators/schema/checkInSchema";

/** Corpo HTTP de check-in (snake_case da API). */
export const checkInBodySchema = z.object({
  unique_code: checkInSchema.shape.uniqueCode,
});
