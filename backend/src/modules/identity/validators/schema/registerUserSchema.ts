import { z } from "zod";
import { cpfDocumentSchema } from "./cpfDocumentSchema";

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres")
    .max(128),
  document: cpfDocumentSchema,
});

export type RegisterUserInputSchema = z.infer<typeof registerUserSchema>;
