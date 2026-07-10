import { z } from "zod";

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

const HAS_LOWERCASE = /[a-z]/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[^a-zA-Z0-9]/;

function validatePasswordComplexity(value: string, ctx: z.RefinementCtx): void {
  if (value.length < MIN_LENGTH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Senha deve ter ao menos ${MIN_LENGTH} caracteres`,
    });
    return;
  }

  if (!HAS_LOWERCASE.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Senha deve conter ao menos uma letra minúscula",
    });
  }

  if (!HAS_UPPERCASE.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Senha deve conter ao menos uma letra maiúscula",
    });
  }

  if (!HAS_DIGIT.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Senha deve conter ao menos um número",
    });
  }

  if (!HAS_SPECIAL.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Senha deve conter ao menos um caractere especial",
    });
  }
}

/** Senha com requisitos mínimos de complexidade (cadastro e nova senha). */
export const passwordSchema = z
  .string()
  .max(MAX_LENGTH, `Senha deve ter no máximo ${MAX_LENGTH} caracteres`)
  .superRefine(validatePasswordComplexity);

export type PasswordSchema = z.infer<typeof passwordSchema>;
