import { z } from "zod";
import { cpfDocumentSchema } from "./cpfDocumentSchema";
import { passwordSchema } from "./passwordSchema";

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: passwordSchema,
  document: cpfDocumentSchema,
});

export type RegisterUserInputSchema = z.infer<typeof registerUserSchema>;
