import type { MigrationInterface, QueryRunner } from "typeorm";

function slugifyEventTitle(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug.length > 0 ? slug : "evento";
}

function uniqueSlug(base: string, used: Set<string>): string {
  let candidate = base;
  let suffix = 2;

  while (used.has(candidate)) {
    const suffixText = `-${suffix}`;
    candidate = `${base.slice(0, Math.max(1, 80 - suffixText.length))}${suffixText}`;
    suffix += 1;
  }

  used.add(candidate);
  return candidate;
}

export class AddSlugToEvents1779827613034 implements MigrationInterface {
  name = "AddSlugToEvents1779827613034";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "slug" character varying(100)
    `);

    const events: Array<{ id: string; title: string }> = await queryRunner.query(
      `SELECT "id", "title" FROM "events" ORDER BY "id" ASC`,
    );

    const used = new Set<string>();

    for (const event of events) {
      const slug = uniqueSlug(slugifyEventTitle(event.title), used);
      await queryRunner.query(`UPDATE "events" SET "slug" = $1 WHERE "id" = $2`, [
        slug,
        event.id,
      ]);
    }

    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "slug" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "UQ_events_slug" UNIQUE ("slug")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_slug" ON "events" ("slug")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_events_slug"`);
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "UQ_events_slug"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "slug"`);
  }
}
