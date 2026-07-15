/**
 * @file Serviço: lê o percentual da taxa de plataforma (DB com fallback env + cache).
 * @module modules/sales/application/services/getPlatformFeePercent
 */

import { env } from "../../../../shared/infrastructure/config/env";
import { PLATFORM_FEE_PERCENT_KEY } from "../../../../shared/kernel/platformSettingKeys";
import { findPlatformSettingByKey } from "../queries/findPlatformSettingByKey";

const CACHE_TTL_MS = 30_000;

let cached: { percent: number; expiresAt: number } | null = null;

export function invalidatePlatformFeePercentCache(): void {
  cached = null;
}

function parsePercent(raw: string | null | undefined, fallback: number): number {
  if (raw == null || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return fallback;
  }
  return parsed;
}

/** Percentual vigente para cálculo de pedidos e exibição. */
export async function getPlatformFeePercent(): Promise<number> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.percent;
  }

  const fallback = env.payment.platformFeePercent;
  let percent = fallback;

  try {
    const setting = await findPlatformSettingByKey(PLATFORM_FEE_PERCENT_KEY);
    percent = parsePercent(setting?.value, fallback);
  } catch {
    percent = fallback;
  }

  cached = { percent, expiresAt: now + CACHE_TTL_MS };
  return percent;
}
