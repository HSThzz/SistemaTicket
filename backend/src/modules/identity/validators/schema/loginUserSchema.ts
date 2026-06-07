import { z } from "zod";

export const loginUserSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginUserInputSchema = z.infer<typeof loginUserSchema>;
