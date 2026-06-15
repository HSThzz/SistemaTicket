import { z } from "zod";
import { cpfDocumentSchema } from "./cpfDocumentSchema";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  document: cpfDocumentSchema,
});

export type UpdateProfileInputSchema = z.infer<typeof updateProfileSchema>;
