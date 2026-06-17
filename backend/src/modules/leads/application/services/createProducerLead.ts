/**
 * @file Serviço de criação de lead de produtor (persistência + fila assíncrona).
 * @module modules/leads/application/services/createProducerLead
 */

import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { ProducerLead } from "../../../../shared/infrastructure/persistence/entities/ProducerLead";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { enqueueContactFormNotification } from "../commands/enqueueContactFormNotification";

export type CreateProducerLeadInput = Prettify<{
  name: string;
  email: string;
  phone?: string;
}>;

export type CreateProducerLeadResult = Prettify<{
  id: string;
}>;

/**
 * Salva o lead no banco e delega notificações externas para a fila `contact-form`.
 */
export async function createProducerLead(
  input: CreateProducerLeadInput,
): Promise<CreateProducerLeadResult> {
  const lead = await AppDataSource.getRepository(ProducerLead).save({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
  });

  await enqueueContactFormNotification({
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
  });

  return { id: lead.id };
}
