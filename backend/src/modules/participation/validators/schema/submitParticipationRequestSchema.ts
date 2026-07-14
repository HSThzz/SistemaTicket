import { z } from "zod";
import {
  INSTAGRAM_HANDLE_MAX_LENGTH,
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from "../../application/helpers/normalizeInstagramHandle";

/** Nome e e-mail vêm da conta autenticada — body aceita telefone e Instagram opcionais. */
export const submitParticipationRequestSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(32, "Telefone deve ter no máximo 32 caracteres")
    .optional()
    .transform((value) => value || undefined),
  instagramHandle: z
    .string()
    .trim()
    .max(80, "Instagram inválido")
    .optional()
    .transform((value) => normalizeInstagramHandle(value))
    .refine(
      (value) => value === undefined || isValidInstagramHandle(value),
      `Informe um @ válido do Instagram (até ${INSTAGRAM_HANDLE_MAX_LENGTH} caracteres)`,
    ),
});

export type SubmitParticipationRequestInputSchema = z.infer<
  typeof submitParticipationRequestSchema
>;
