/**
 * @file Schema Zod para atualizar a taxa de plataforma.
 * @module modules/sales/validators/schema/updatePlatformFeeSchema
 */

import { z } from "zod";

export const updatePlatformFeeSchema = z.object({
  percent: z.coerce
    .number({ message: "Informe o percentual da taxa" })
    .min(0, "A taxa não pode ser negativa")
    .max(100, "A taxa não pode passar de 100%"),
});

export type UpdatePlatformFeeInputSchema = z.infer<typeof updatePlatformFeeSchema>;
