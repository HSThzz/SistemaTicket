/**
 * @file Cliente HTTP para envio do formulário de contato de produtores.
 * @module modules/leads/api/leadService
 */

import { api } from "@/shared/api/client";

export type SubmitProducerContactInput = {
  name: string;
  email: string;
  phone?: string;
};

export type SubmitProducerContactResponse = {
  message: string;
};

/**
 * Envia lead do formulário de produtores; notificações são processadas em background.
 */
export async function submitProducerContact(
  input: SubmitProducerContactInput,
): Promise<SubmitProducerContactResponse> {
  const { data } = await api.post<SubmitProducerContactResponse>(
    "/leads/producer-contact",
    input,
  );
  return data;
}
