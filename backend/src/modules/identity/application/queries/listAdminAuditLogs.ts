import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { AdminAuditLog } from "../../../../shared/infrastructure/persistence/entities/AdminAuditLog";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";

export interface AdminAuditLogView {
  id: string;
  actorUserId: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function listAdminAuditLogs(limit = 50): Promise<AdminAuditLogView[]> {
  const cappedLimit = Math.min(Math.max(limit, 1), 100);
  const repository = AppDataSource.getRepository(AdminAuditLog);

  const rows = await repository
    .createQueryBuilder("log")
    .leftJoin(User, "actor", "actor.id = log.actor_user_id")
    .select([
      "log.id AS id",
      "log.actor_user_id AS actor_user_id",
      "actor.name AS actor_name",
      "actor.email AS actor_email",
      "log.action AS action",
      "log.target_type AS target_type",
      "log.target_id AS target_id",
      "log.metadata AS metadata",
      "log.created_at AS created_at",
    ])
    .orderBy("log.created_at", "DESC")
    .limit(cappedLimit)
    .getRawMany<{
      id: string;
      actor_user_id: string;
      actor_name: string | null;
      actor_email: string | null;
      action: string;
      target_type: string;
      target_id: string;
      metadata: Record<string, unknown> | null;
      created_at: Date;
    }>();

  return rows.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  }));
}
