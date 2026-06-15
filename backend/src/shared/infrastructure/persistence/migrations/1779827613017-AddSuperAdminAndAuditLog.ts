import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperAdminAndAuditLog1779827613017 implements MigrationInterface {
  name = "AddSuperAdminAndAuditLog1779827613017";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'
    `);

    await queryRunner.query(`
      CREATE TABLE "admin_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_user_id" uuid NOT NULL,
        "action" varchar(64) NOT NULL,
        "target_type" varchar(32) NOT NULL,
        "target_id" varchar(64) NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_admin_audit_logs_created_at"
      ON "admin_audit_logs" ("created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
  }
}
