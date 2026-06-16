import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToEvents1779827613021 implements MigrationInterface {
  name = "AddDeletedAtToEvents1779827613021";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "deleted_at" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN "deleted_at"
    `);
  }
}
