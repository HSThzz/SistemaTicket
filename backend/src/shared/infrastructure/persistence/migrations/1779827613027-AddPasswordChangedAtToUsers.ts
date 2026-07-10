import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordChangedAtToUsers1779827613027 implements MigrationInterface {
  name = "AddPasswordChangedAtToUsers1779827613027";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "password_changed_at" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "password_changed_at"
    `);
  }
}
