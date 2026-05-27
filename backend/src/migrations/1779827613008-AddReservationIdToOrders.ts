import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationIdToOrders1779827613008 implements MigrationInterface {
  name = "AddReservationIdToOrders1779827613008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "reservation_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_reservation_id"
      FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "UQ_orders_reservation_id" UNIQUE ("reservation_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" DROP CONSTRAINT "UQ_orders_reservation_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_reservation_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders" DROP COLUMN "reservation_id"
    `);
  }
}
