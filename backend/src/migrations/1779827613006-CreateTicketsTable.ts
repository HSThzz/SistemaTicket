import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketsTable1779827613006 implements MigrationInterface {
  name = "CreateTicketsTable1779827613006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."tickets_status_enum" AS ENUM(
        'ACTIVE',
        'USED',
        'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "ticket_lot_id" uuid NOT NULL,
        "owner_name" character varying(255) NOT NULL,
        "owner_document" character varying(18) NOT NULL,
        "unique_code" character varying(64) NOT NULL,
        "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "UQ_9c7fb4bc050a8488763b443daa5" UNIQUE ("unique_code"),
        CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_bd5636236f799b19f132abf8d70"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_fe8680feced885fe3a9ed94c6e6"
      FOREIGN KEY ("ticket_lot_id") REFERENCES "ticket_lots"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets" DROP CONSTRAINT "FK_fe8680feced885fe3a9ed94c6e6"
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets" DROP CONSTRAINT "FK_bd5636236f799b19f132abf8d70"
    `);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
  }
}
