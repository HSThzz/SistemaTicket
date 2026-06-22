import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeToEvents1779827613023 implements MigrationInterface {
  name = "AddTypeToEvents1779827613023";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."events_type_enum" AS ENUM('PUBLIC', 'PRIVATE')
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "type" "public"."events_type_enum" NOT NULL DEFAULT 'PUBLIC'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."events_type_enum"`);
  }
}
