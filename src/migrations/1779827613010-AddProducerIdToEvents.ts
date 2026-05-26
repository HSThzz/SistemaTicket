import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProducerIdToEvents1779827613010 implements MigrationInterface {
  name = "AddProducerIdToEvents1779827613010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "producer_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "FK_events_producer_id"
      FOREIGN KEY ("producer_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_producer_id" ON "events" ("producer_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_events_producer_id"`);
    await queryRunner.query(`
      ALTER TABLE "events" DROP CONSTRAINT "FK_events_producer_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN "producer_id"
    `);
  }
}
