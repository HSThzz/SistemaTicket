import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPixPaymentToOrders1779827613012 implements MigrationInterface {
  name = "AddPixPaymentToOrders1779827613012";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "pix_copy_paste" text,
      ADD COLUMN "pix_expires_at" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN "pix_copy_paste",
      DROP COLUMN "pix_expires_at"
    `);
  }
}
