/**
 * @file Entidade de auditoria de ações administrativas sensíveis.
 * @module shared/infrastructure/persistence/entities/AdminAuditLog
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AdminAuditAction } from "../../../kernel/enums";

/** Registro imutável de ação executada por equipe administrativa. */
@Entity("admin_audit_logs")
export class AdminAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "actor_user_id", type: "uuid" })
  actorUserId!: string;

  @Column({
    type: "varchar",
    length: 64,
  })
  action!: AdminAuditAction;

  @Column({ name: "target_type", type: "varchar", length: 32 })
  targetType!: string;

  @Column({ name: "target_id", type: "varchar", length: 64 })
  targetId!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
