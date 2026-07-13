/**
 * @file Serviço de criação de lead de produtor (persistência + fila assíncrona).
 * @module modules/leads/application/services/createProducerLead
 */

import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ProducerLead } from "../../../../shared/infrastructure/persistence/entities/ProducerLead";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { enqueueContactFormNotification } from "../commands/enqueueContactFormNotification";
import { findRecentProducerLeadByEmail } from "../queries/findRecentProducerLeadByEmail";

const CONTEXT = "createProducerLead";
const logger = Logger.getInstance();

export type CreateProducerLeadInput = Prettify<{
  name: string;
  email: string;
  phone?: string;
}>;

/**
 * Salva o lead (com dedupe 24h por e-mail) e enfileira notificações.
 * Em cooldown, reutiliza o lead recente e tenta garantir o enqueue.
 */
export async function createProducerLead(
  input: CreateProducerLeadInput,
): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const recent = await findRecentProducerLeadByEmail(email);

  if (recent) {
    logger.info(CONTEXT, "Producer lead deduplicated within cooldown window", {
      leadId: recent.id,
    });

    await enqueueContactFormNotification({
      leadId: recent.id,
      name: recent.name,
      email: recent.email,
      phone: recent.phone,
    });
    return;
  }

  const lead = await AppDataSource.getRepository(ProducerLead).save({
    name: input.name,
    email,
    phone: input.phone ?? null,
  });

  await enqueueContactFormNotification({
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
  });
}
