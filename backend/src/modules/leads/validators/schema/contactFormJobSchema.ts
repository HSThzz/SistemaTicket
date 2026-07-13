/**
 * @file Schema Zod do job de notificação do formulário de contato.
 * @module modules/leads/validators/schema/contactFormJobSchema
 */

import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const contactFormJobSchema = z.object({
  leadId: uuidSchema,
  name: z.string().trim().min(1).max(255),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(32).nullable(),
});

export type ContactFormJobSchema = z.infer<typeof contactFormJobSchema>;
