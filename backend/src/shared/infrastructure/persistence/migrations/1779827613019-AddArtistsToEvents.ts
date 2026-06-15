import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddArtistsToEvents1779827613019 implements MigrationInterface {
  name = "AddArtistsToEvents1779827613019";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "artists" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "artists"`);
  }
}
