import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketLotsTable1779827613003 implements MigrationInterface {
  name = "CreateTicketLotsTable1779827613003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ticket_lots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "price" integer NOT NULL,
        "total_quantity" integer NOT NULL,
        "available_quantity" integer NOT NULL,
        CONSTRAINT "PK_b4076f463915ed54f862ef64811" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_lots"
      ADD CONSTRAINT "FK_77fe7672c75113952f32c590f0c"
      FOREIGN KEY ("event_id") REFERENCES "events"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ticket_lots" DROP CONSTRAINT "FK_77fe7672c75113952f32c590f0c"
    `);
    await queryRunner.query(`DROP TABLE "ticket_lots"`);
  }
}
