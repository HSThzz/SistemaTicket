/**
 * @file Schemas Zod para rotas HTTP de ingressos (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/ticketing.schemas
 */

import { z } from "zod";
import { checkInSchema } from "../../../../modules/ticketing/validators/schema/checkInSchema";
import { listUserTicketsQuerySchema } from "../../../../modules/ticketing/validators/schema/listUserTicketsQuerySchema";
import { issueManualTicketSchema } from "../../../../modules/ticketing/validators/schema/issueManualTicketSchema";

/** Corpo HTTP de check-in (snake_case da API). */
export const checkInBodySchema = z.object({
  unique_code: checkInSchema.shape.uniqueCode,
});

/** Query de listagem paginada de ingressos do usuário. */
export { listUserTicketsQuerySchema };

/** Corpo HTTP de emissão manual de ingressos (super admin). */
export const issueManualTicketBodySchema = issueManualTicketSchema;
