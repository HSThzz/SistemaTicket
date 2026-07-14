import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstagramHandleToParticipationRequests1779827613031
  implements MigrationInterface
{
  name = "AddInstagramHandleToParticipationRequests1779827613031";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "participation_requests"
      ADD COLUMN "instagram_handle" varchar(30)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "participation_requests"
      DROP COLUMN "instagram_handle"
    `);
  }
}
