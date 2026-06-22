import { z } from "zod";
import { EventStatus, EventType } from "../../../../shared/kernel/enums";
import { dateStringSchema, optionalImageUrlSchema } from "../../../../shared/kernel/zodFields";

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).optional(),
    date: dateStringSchema.optional(),
    location: z.string().trim().min(1).optional(),
    imageUrl: optionalImageUrlSchema,
    status: z.nativeEnum(EventStatus, { message: "Status inválido" }).optional(),
    type: z.nativeEnum(EventType, { message: "Tipo de evento inválido" }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export type UpdateEventInputSchema = z.infer<typeof updateEventSchema>;
