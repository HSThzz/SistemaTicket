import { z } from "zod";
import { CURRENT_LEGAL_DOCUMENTS_VERSION } from "../../domain/legalDocuments";
import { cpfDocumentSchema } from "./cpfDocumentSchema";
import { passwordSchema } from "./passwordSchema";

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: passwordSchema,
  document: cpfDocumentSchema,
  acceptedTerms: z.literal(true, {
    error: "É necessário aceitar os termos para criar a conta",
  }),
  termsVersion: z
    .string()
    .trim()
    .refine((value) => value === CURRENT_LEGAL_DOCUMENTS_VERSION, {
      message: `Versão dos termos inválida. Aceite a versão ${CURRENT_LEGAL_DOCUMENTS_VERSION}`,
    }),
});

export type RegisterUserInputSchema = z.infer<typeof registerUserSchema>;
