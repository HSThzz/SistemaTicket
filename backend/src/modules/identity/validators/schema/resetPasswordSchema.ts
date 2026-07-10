import { z } from "zod";
import { passwordSchema } from "./passwordSchema";

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token inválido").max(512),
  newPassword: passwordSchema,
});

export type ResetPasswordInputSchema = z.infer<typeof resetPasswordSchema>;
