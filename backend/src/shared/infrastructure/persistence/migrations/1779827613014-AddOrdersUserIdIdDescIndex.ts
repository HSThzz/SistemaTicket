import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrdersUserIdIdDescIndex1779827613014 implements MigrationInterface {
  name = "AddOrdersUserIdIdDescIndex1779827613014";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "idx_orders_user_id_id_desc" ON "orders" ("user_id", "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_orders_user_id_id_desc"`);
  }
}
