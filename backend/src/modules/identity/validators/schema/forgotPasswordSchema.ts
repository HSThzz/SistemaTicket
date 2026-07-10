import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
});

export type ForgotPasswordInputSchema = z.infer<typeof forgotPasswordSchema>;
