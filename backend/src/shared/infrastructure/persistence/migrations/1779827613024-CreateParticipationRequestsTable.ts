import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateParticipationRequestsTable1779827613024
  implements MigrationInterface
{
  name = "CreateParticipationRequestsTable1779827613024";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."participation_requests_status_enum"
      AS ENUM('PENDING', 'APPROVED', 'REJECTED')
    `);

    await queryRunner.query(`
      CREATE TABLE "participation_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" uuid NOT NULL,
        "user_id" uuid,
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(32),
        "status" "public"."participation_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "reviewed_by" uuid,
        "reviewed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participation_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_participation_requests_event" FOREIGN KEY ("event_id")
          REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_participation_requests_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_participation_requests_event_status"
      ON "participation_requests" ("event_id", "status")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_requests_event_user"
      ON "participation_requests" ("event_id", "user_id")
      WHERE "user_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "participation_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."participation_requests_status_enum"`,
    );
  }
}
