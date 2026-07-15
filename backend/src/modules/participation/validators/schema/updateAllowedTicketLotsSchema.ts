/**
 * @file Schema Zod para atualizar lotes liberados de uma participação aprovada.
 * @module modules/participation/validators/schema/updateAllowedTicketLotsSchema
 */

import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const updateAllowedTicketLotsSchema = z.object({
  ticketLotIds: z
    .array(uuidSchema)
    .min(1, "Selecione ao menos um lote"),
});

export type UpdateAllowedTicketLotsInputSchema = z.infer<
  typeof updateAllowedTicketLotsSchema
>;
