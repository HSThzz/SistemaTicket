/**
 * @file Ledger Redis para envios de e-mail idempotentes.
 * @module modules/notifications/application/helpers/emailDeliveryLedger
 */

import { getRedis } from "../../../../shared/infrastructure/config/redis";

const KEY_PREFIX = "email:sent:";
/** 30 dias — cobre retries longos e reprocessamento operacional. */
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

function fullKey(deliveryKey: string): string {
  return `${KEY_PREFIX}${deliveryKey}`;
}

/**
 * Tenta reivindicar o envio. `false` = já enviado (ou em andamento pós-sucesso).
 * Em falha de send, chamar {@link releaseEmailDeliveryClaim}.
 */
export async function claimEmailDelivery(
  deliveryKey: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<boolean> {
  const inserted = await getRedis().set(
    fullKey(deliveryKey),
    "1",
    "EX",
    ttlSeconds,
    "NX",
  );
  return inserted === "OK";
}

/** Libera a claim para permitir retry após falha no provedor. */
export async function releaseEmailDeliveryClaim(
  deliveryKey: string,
): Promise<void> {
  await getRedis().del(fullKey(deliveryKey));
}
