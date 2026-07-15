import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlatformSettings1779827613036 implements MigrationInterface {
  name = "CreatePlatformSettings1779827613036";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "platform_settings" (
        "key" character varying(64) NOT NULL,
        "value" text NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_platform_settings_key" PRIMARY KEY ("key")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "platform_settings" ("key", "value")
      VALUES ('platform_fee_percent', '10')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "platform_settings"`);
  }
}
