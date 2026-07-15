/**
 * @file Command: upsert de configuração da plataforma.
 * @module modules/sales/application/commands/upsertPlatformSetting
 */

import { PlatformSetting } from "../../../../shared/infrastructure/persistence/entities/PlatformSetting";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function upsertPlatformSetting(
  key: string,
  value: string,
): Promise<PlatformSetting> {
  const repository = AppDataSource.getRepository(PlatformSetting);
  const existing = await repository
    .createQueryBuilder("setting")
    .where("setting.key = :key", { key })
    .getOne();

  if (existing) {
    existing.value = value;
    return repository.save(existing);
  }

  return repository.save(repository.create({ key, value }));
}
