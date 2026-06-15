import { z } from "zod";

export const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Informe a senha atual")
    .max(128),
  newPassword: z
    .string()
    .min(6, "Nova senha deve ter ao menos 6 caracteres")
    .max(128),
});

export type UpdatePasswordInputSchema = z.infer<typeof updatePasswordSchema>;
