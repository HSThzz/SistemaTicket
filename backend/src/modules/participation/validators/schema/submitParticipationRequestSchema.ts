import { z } from "zod";

/** Nome e e-mail vêm da conta autenticada — o body só aceita telefone opcional. */
export const submitParticipationRequestSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(32, "Telefone deve ter no máximo 32 caracteres")
    .optional()
    .transform((value) => value || undefined),
});

export type SubmitParticipationRequestInputSchema = z.infer<
  typeof submitParticipationRequestSchema
>;
