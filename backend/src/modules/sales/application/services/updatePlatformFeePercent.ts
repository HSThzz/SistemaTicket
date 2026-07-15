/**
 * @file Serviço: atualiza o percentual da taxa de plataforma (SUPER_ADMIN).
 * @module modules/sales/application/services/updatePlatformFeePercent
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { AdminAuditAction } from "../../../../shared/kernel/enums";
import { PLATFORM_FEE_PERCENT_KEY } from "../../../../shared/kernel/platformSettingKeys";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { createAdminAuditLog } from "../../../identity/application/commands/createAdminAuditLog";
import {
  updatePlatformFeeSchema,
  type UpdatePlatformFeeInputSchema,
} from "../../validators/schema/updatePlatformFeeSchema";
import { upsertPlatformSetting } from "../commands/upsertPlatformSetting";
import {
  getPlatformFeePercent,
  invalidatePlatformFeePercentCache,
} from "./getPlatformFeePercent";

const CONTEXT = "updatePlatformFeePercent";

export async function updatePlatformFeePercent(
  input: UpdatePlatformFeeInputSchema,
  actorUserId: string,
): Promise<{ percent: number; previousPercent: number }> {
  const data = validateSchema(updatePlatformFeeSchema, input);
  const previousPercent = await getPlatformFeePercent();
  const normalized = Math.round(data.percent * 100) / 100;

  await upsertPlatformSetting(PLATFORM_FEE_PERCENT_KEY, String(normalized));
  invalidatePlatformFeePercentCache();

  await createAdminAuditLog({
    actorUserId,
    action: AdminAuditAction.PLATFORM_FEE_UPDATED,
    targetType: "platform_setting",
    targetId: PLATFORM_FEE_PERCENT_KEY,
    metadata: {
      previousPercent,
      percent: normalized,
    },
  });

  Logger.getInstance().info(CONTEXT, "Platform fee percent updated", {
    previousPercent,
    percent: normalized,
    actorUserId,
  });

  return { percent: normalized, previousPercent };
}
