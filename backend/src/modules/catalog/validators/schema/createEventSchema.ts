import { z } from "zod";
import { EventType } from "../../../../shared/kernel/enums";
import { dateStringSchema, optionalImageUrlSchema } from "../../../../shared/kernel/zodFields";

/** Cadastro sempre inicia como rascunho — status não é aceito no body. */
export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(255),
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  date: dateStringSchema,
  location: z.string().trim().min(1, "Local é obrigatório"),
  imageUrl: optionalImageUrlSchema,
  type: z.enum(EventType, { message: "Tipo de evento inválido" }).optional(),
});

export type CreateEventInputSchema = z.infer<typeof createEventSchema>;
