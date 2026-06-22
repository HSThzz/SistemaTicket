import { MigrationInterface, QueryRunner } from "typeorm";
import { generateTicketCheckInCode } from "../../../kernel/ticketCheckInCode";

export class AddCheckInCodeToTickets1779827613025 implements MigrationInterface {
  name = "AddCheckInCodeToTickets1779827613025";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD COLUMN "check_in_code" character varying(8)
    `);

    const rows = (await queryRunner.query(
      `SELECT "id" FROM "tickets" WHERE "check_in_code" IS NULL`,
    )) as Array<{ id: string }>;

    const used = new Set<string>();

    for (const row of rows) {
      let code = generateTicketCheckInCode();

      while (used.has(code)) {
        code = generateTicketCheckInCode();
      }

      used.add(code);

      await queryRunner.query(
        `UPDATE "tickets" SET "check_in_code" = $1 WHERE "id" = $2`,
        [code, row.id],
      );
    }

    await queryRunner.query(`
      ALTER TABLE "tickets"
      ALTER COLUMN "check_in_code" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_tickets_check_in_code"
      ON "tickets" ("check_in_code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_tickets_check_in_code"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "check_in_code"`);
  }
}
