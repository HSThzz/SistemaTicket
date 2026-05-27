import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventsTable1779827613002 implements MigrationInterface {
  name = "CreateEventsTable1779827613002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."events_status_enum" AS ENUM(
        'DRAFT',
        'PUBLISHED',
        'CANCELLED',
        'FINISHED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "location" character varying(255) NOT NULL,
        "status" "public"."events_status_enum" NOT NULL DEFAULT 'DRAFT',
        CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
  }
}
