import type { MigrationInterface, QueryRunner } from "typeorm";

const SEED_EVENT_ARTISTS: Array<{ title: string; artists: string[] }> = [
  { title: "Festival TicketFlow 2026", artists: ["Anitta", "Matuê", "Jão"] },
  { title: "Stand-up Comedy Night", artists: ["Afonso Padilha", "Fábio Porchat"] },
  { title: "Rock Nacional ao Vivo", artists: ["Titãs", "Capital Inicial", "Legião Urbana"] },
  { title: "Noite de Jazz & Vinho", artists: ["Eliane Elias", "João Donato"] },
  { title: "Sunset Electronic Fest", artists: ["Alok", "Vintage Culture", "Cat Dealers"] },
];

export class BackfillSeedEventArtists1779827613020 implements MigrationInterface {
  name = "BackfillSeedEventArtists1779827613020";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const item of SEED_EVENT_ARTISTS) {
      await queryRunner.query(
        `
          UPDATE "events"
          SET "artists" = $1::jsonb
          WHERE "title" = $2
            AND ("artists" = '[]'::jsonb OR "artists" IS NULL)
        `,
        [JSON.stringify(item.artists), item.title],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const item of SEED_EVENT_ARTISTS) {
      await queryRunner.query(
        `
          UPDATE "events"
          SET "artists" = '[]'::jsonb
          WHERE "title" = $1
        `,
        [item.title],
      );
    }
  }
}
