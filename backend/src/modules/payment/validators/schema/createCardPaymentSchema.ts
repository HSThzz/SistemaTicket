import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

/** Schema de pagamento via cartão de crédito (token gerado no front-end). */
export const createCardPaymentSchema = z.object({
  orderId: uuidSchema,
  requesterUserId: uuidSchema,
  token: z.string().trim().min(1, "token do cartão é obrigatório"),
  paymentMethodId: z
    .string()
    .trim()
    .min(1, "payment_method_id é obrigatório"),
  issuerId: z.coerce
    .number()
    .int("issuer_id deve ser um número inteiro")
    .positive("issuer_id é obrigatório para cartão no Brasil"),
  installments: z.coerce
    .number()
    .int("Parcelas deve ser um número inteiro")
    .min(1, "Mínimo de 1 parcela")
    .max(24, "Máximo de 24 parcelas")
    .default(1),
  payerEmail: z.email("E-mail do pagador inválido").optional(),
  payerDocument: z
    .string()
    .trim()
    .min(11, "CPF/CNPJ inválido")
    .optional(),
});

export type CreateCardPaymentInputSchema = z.infer<typeof createCardPaymentSchema>;
