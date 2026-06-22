import { z } from "zod";

export const checkInSchema = z.object({
  uniqueCode: z
    .string()
    .trim()
    .min(6, "Código do ingresso é obrigatório")
    .max(128),
});

export type CheckInInputSchema = z.infer<typeof checkInSchema>;
