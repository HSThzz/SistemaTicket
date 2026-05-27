import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketCheckedInAt1779827613009 implements MigrationInterface {
  name = "AddTicketCheckedInAt1779827613009";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD COLUMN "checked_in_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets" DROP COLUMN "checked_in_at"
    `);
  }
}
