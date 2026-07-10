import { z } from "zod";
import { passwordSchema } from "./passwordSchema";

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Informe a senha atual")
      .max(128),
    newPassword: passwordSchema,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha deve ser diferente da senha atual",
    path: ["newPassword"],
  });

export type UpdatePasswordInputSchema = z.infer<typeof updatePasswordSchema>;
