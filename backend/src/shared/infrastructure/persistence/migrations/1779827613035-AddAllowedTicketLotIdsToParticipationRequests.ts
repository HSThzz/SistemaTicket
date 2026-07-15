import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllowedTicketLotIdsToParticipationRequests1779827613035
  implements MigrationInterface
{
  name = "AddAllowedTicketLotIdsToParticipationRequests1779827613035";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "participation_requests"
      ADD COLUMN "allowed_ticket_lot_ids" uuid[]
    `);

    await queryRunner.query(`
      UPDATE "participation_requests" AS pr
      SET "allowed_ticket_lot_ids" = (
        SELECT COALESCE(array_agg(tl."id"), ARRAY[]::uuid[])
        FROM "ticket_lots" AS tl
        WHERE tl."event_id" = pr."event_id"
      )
      WHERE pr."status" = 'APPROVED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "participation_requests"
      DROP COLUMN "allowed_ticket_lot_ids"
    `);
  }
}
