import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres")
    .max(128),
  document: z.string().trim().min(11, "Documento inválido").max(18),
});

export type RegisterUserInputSchema = z.infer<typeof registerUserSchema>;
