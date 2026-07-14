import { z } from "zod";
import { isValidCpf, sanitizeDocument } from "../../../../shared/kernel/cpf";

/** CPF informado com ou sem máscara — normalizado para 11 dígitos e validado. */
export const cpfDocumentSchema = z
  .string()
  .trim()
  .min(11, "CPF inválido")
  .max(14, "CPF inválido")
  .transform(sanitizeDocument)
  .refine((value) => value.length === 11, "CPF deve ter 11 dígitos")
  .refine(isValidCpf, "CPF inválido");
