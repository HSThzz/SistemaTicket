/**
 * @file Cliente HTTP de configurações da plataforma.
 * @module modules/sales/api/platformSettingsService
 */

import { api } from "@/shared/api/client";

export async function getPlatformFeePercent(): Promise<number> {
  const { data } = await api.get<{ percent: number }>("/platform/fee");
  return data.percent;
}

export async function updatePlatformFeePercent(
  percent: number,
): Promise<{ percent: number; previousPercent: number }> {
  const { data } = await api.patch<{ percent: number; previousPercent: number }>(
    "/platform/fee",
    { percent },
  );
  return data;
}
