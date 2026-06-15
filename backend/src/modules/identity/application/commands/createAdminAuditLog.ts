import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { AdminAuditLog } from "../../../../shared/infrastructure/persistence/entities/AdminAuditLog";
import type { AdminAuditAction } from "../../../../shared/kernel/enums";

export interface CreateAdminAuditLogInput {
  actorUserId: string;
  action: AdminAuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export async function createAdminAuditLog(
  input: CreateAdminAuditLogInput,
): Promise<void> {
  const repository = AppDataSource.getRepository(AdminAuditLog);

  await repository.save(
    repository.create({
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? null,
    }),
  );
}
