/**
 * @file Query: busca configuração da plataforma por chave.
 * @module modules/sales/application/queries/findPlatformSettingByKey
 */

import { PlatformSetting } from "../../../../shared/infrastructure/persistence/entities/PlatformSetting";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findPlatformSettingByKey(
  key: string,
): Promise<PlatformSetting | null> {
  return AppDataSource.getRepository(PlatformSetting)
    .createQueryBuilder("setting")
    .where("setting.key = :key", { key })
    .getOne();
}
