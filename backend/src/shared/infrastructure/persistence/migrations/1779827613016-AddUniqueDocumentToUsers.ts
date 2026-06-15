import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueDocumentToUsers1779827613016 implements MigrationInterface {
  name = "AddUniqueDocumentToUsers1779827613016";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "document" = regexp_replace("document", '[^0-9]', '', 'g')
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "UQ_users_document" UNIQUE ("document")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_document"
    `);
  }
}
