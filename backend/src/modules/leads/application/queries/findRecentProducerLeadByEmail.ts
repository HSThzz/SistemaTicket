/**
 * @file Query: lead recente pelo e-mail (cooldown / dedupe).
 * @module modules/leads/application/queries/findRecentProducerLeadByEmail
 */

import { MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { ProducerLead } from "../../../../shared/infrastructure/persistence/entities/ProducerLead";

/** Janela de deduplicação de leads pelo mesmo e-mail. */
export const PRODUCER_LEAD_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function findRecentProducerLeadByEmail(
  email: string,
  windowMs = PRODUCER_LEAD_DEDUPE_WINDOW_MS,
): Promise<ProducerLead | null> {
  const since = new Date(Date.now() - windowMs);

  return AppDataSource.getRepository(ProducerLead).findOne({
    where: {
      email,
      createdAt: MoreThanOrEqual(since),
    },
    order: { createdAt: "DESC" },
  });
}
