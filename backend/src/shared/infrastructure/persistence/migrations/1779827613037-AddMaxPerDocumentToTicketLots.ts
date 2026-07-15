import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaxPerDocumentToTicketLots1779827613037
  implements MigrationInterface
{
  name = "AddMaxPerDocumentToTicketLots1779827613037";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ticket_lots"
      ADD COLUMN "max_per_document" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ticket_lots"
      DROP COLUMN "max_per_document"
    `);
  }
}
