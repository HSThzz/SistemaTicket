import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventCheckInStaffTable1779827613030
  implements MigrationInterface
{
  name = "CreateEventCheckInStaffTable1779827613030";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "event_check_in_staff" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "added_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_check_in_staff" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_check_in_staff_event"
          FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_event_check_in_staff_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_event_check_in_staff_added_by"
          FOREIGN KEY ("added_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_event_check_in_staff_event_user"
      ON "event_check_in_staff" ("event_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_check_in_staff_user"
      ON "event_check_in_staff" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_event_check_in_staff_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_event_check_in_staff_event_user"`,
    );
    await queryRunner.query(`DROP TABLE "event_check_in_staff"`);
  }
}
