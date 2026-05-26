import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReservationsTable1779827613005 implements MigrationInterface {
  name = "CreateReservationsTable1779827613005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."reservations_status_enum" AS ENUM(
        'PENDING',
        'COMPLETED',
        'EXPIRED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "ticket_lot_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'PENDING',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD CONSTRAINT "FK_4af5055a871c46d011345a255a6"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD CONSTRAINT "FK_5ba31c10b908ecd8606c446e382"
      FOREIGN KEY ("ticket_lot_id") REFERENCES "ticket_lots"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations" DROP CONSTRAINT "FK_5ba31c10b908ecd8606c446e382"
    `);
    await queryRunner.query(`
      ALTER TABLE "reservations" DROP CONSTRAINT "FK_4af5055a871c46d011345a255a6"
    `);
    await queryRunner.query(`DROP TABLE "reservations"`);
    await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
  }
}
