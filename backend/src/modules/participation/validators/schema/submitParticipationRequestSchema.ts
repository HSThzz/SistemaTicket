import { z } from "zod";
import {
  INSTAGRAM_HANDLE_MAX_LENGTH,
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from "../../application/helpers/normalizeInstagramHandle";

function phoneDigitCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

/** Nome e e-mail vêm da conta autenticada — telefone e Instagram são obrigatórios. */
export const submitParticipationRequestSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Informe o telefone")
    .max(32, "Telefone deve ter no máximo 32 caracteres")
    .refine((value) => {
      const digits = phoneDigitCount(value);
      return digits >= 10 && digits <= 11;
    }, "Informe um telefone válido com DDD"),
  instagramHandle: z
    .string()
    .trim()
    .min(1, "Informe o Instagram")
    .max(80, "Instagram inválido")
    .transform((value, ctx) => {
      const handle = normalizeInstagramHandle(value);
      if (!handle || !isValidInstagramHandle(handle)) {
        ctx.addIssue({
          code: "custom",
          message: `Informe um @ válido do Instagram (até ${INSTAGRAM_HANDLE_MAX_LENGTH} caracteres)`,
        });
        return z.NEVER;
      }
      return handle;
    }),
});

export type SubmitParticipationRequestInputSchema = z.infer<
  typeof submitParticipationRequestSchema
>;
