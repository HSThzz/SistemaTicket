import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTermsAcceptanceToUsers1779827613033 implements MigrationInterface {
  name = "AddTermsAcceptanceToUsers1779827613033";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "terms_accepted_at" TIMESTAMPTZ,
      ADD COLUMN "terms_version" character varying(16)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "terms_version",
      DROP COLUMN "terms_accepted_at"
    `);
  }
}
