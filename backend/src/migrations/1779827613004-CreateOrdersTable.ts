import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersTable1779827613004 implements MigrationInterface {
  name = "CreateOrdersTable1779827613004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."orders_status_enum" AS ENUM(
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "total_price" integer NOT NULL,
        "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING',
        "payment_gateway_id" character varying(255),
        CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"
    `);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
  }
}
