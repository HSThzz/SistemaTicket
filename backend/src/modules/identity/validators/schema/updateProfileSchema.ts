import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  document: z.string().trim().min(11, "Documento inválido").max(18),
});

export type UpdateProfileInputSchema = z.infer<typeof updateProfileSchema>;
