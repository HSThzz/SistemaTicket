import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketsIdDescIndex1779827613013 implements MigrationInterface {
  name = "AddTicketsIdDescIndex1779827613013";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "idx_tickets_id_desc" ON "tickets" ("id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_tickets_id_desc"`);
  }
}
