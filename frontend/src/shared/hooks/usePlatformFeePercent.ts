/**
 * @file Hook: percentual vigente da taxa de plataforma (API + fallback local).
 * @module shared/hooks/usePlatformFeePercent
 */

import { useEffect, useState } from "react";
import * as platformSettingsService from "@/modules/sales/api/platformSettingsService";
import { PLATFORM_FEE_PERCENT } from "@/shared/utils/platformFee";

export function usePlatformFeePercent(): number {
  const [percent, setPercent] = useState(PLATFORM_FEE_PERCENT);

  useEffect(() => {
    let cancelled = false;

    platformSettingsService
      .getPlatformFeePercent()
      .then((value) => {
        if (!cancelled && Number.isFinite(value)) {
          setPercent(value);
        }
      })
      .catch(() => {
        /* mantém fallback local */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return percent;
}
