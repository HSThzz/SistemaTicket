import { z } from "zod";

export const producerLeadSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z
    .string()
    .trim()
    .max(32, "Telefone deve ter no máximo 32 caracteres")
    .optional()
    .transform((value) => value || undefined),
});

export type ProducerLeadInputSchema = z.infer<typeof producerLeadSchema>;
