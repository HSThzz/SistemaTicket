import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGuestEmailUniqueToParticipationRequests1779827613026
  implements MigrationInterface
{
  name = "AddGuestEmailUniqueToParticipationRequests1779827613026";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_participation_requests_event_email_guest"
      ON "participation_requests" ("event_id", LOWER("email"))
      WHERE "user_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."UQ_participation_requests_event_email_guest"
    `);
  }
}
