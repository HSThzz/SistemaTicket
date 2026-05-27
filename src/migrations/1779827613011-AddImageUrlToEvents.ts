import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToEvents1779827613011 implements MigrationInterface {
  name = "AddImageUrlToEvents1779827613011";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "image_url" varchar(2048)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN "image_url"
    `);
  }
}
