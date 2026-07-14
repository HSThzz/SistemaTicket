import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToOrders1779827613029 implements MigrationInterface {
  name = "AddCreatedAtToOrders1779827613029";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_orders_user_id_created_at_id_desc"
      ON "orders" ("user_id", "created_at" DESC, "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_orders_user_id_created_at_id_desc"`,
    );
    await queryRunner.query(`
      ALTER TABLE "orders" DROP COLUMN "created_at"
    `);
  }
}
