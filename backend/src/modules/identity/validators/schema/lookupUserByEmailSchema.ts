import { z } from "zod";

export const lookupUserByEmailSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export type LookupUserByEmailInputSchema = z.infer<typeof lookupUserByEmailSchema>;
