import { z } from "zod";
import { passwordSchema } from "./passwordSchema";

export const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Informe a senha atual")
    .max(128),
  newPassword: passwordSchema,
});

export type UpdatePasswordInputSchema = z.infer<typeof updatePasswordSchema>;
