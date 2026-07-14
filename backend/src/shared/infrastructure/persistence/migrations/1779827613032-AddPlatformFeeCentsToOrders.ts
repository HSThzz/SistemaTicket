import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformFeeCentsToOrders1779827613032 implements MigrationInterface {
  name = "AddPlatformFeeCentsToOrders1779827613032";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "platform_fee_cents" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" DROP COLUMN "platform_fee_cents"
    `);
  }
}
