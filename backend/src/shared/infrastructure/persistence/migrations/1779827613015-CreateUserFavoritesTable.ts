import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserFavoritesTable1779827613015 implements MigrationInterface {
  name = "CreateUserFavoritesTable1779827613015";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_favorites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "event_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_favorites" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_favorites_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_favorites_event" FOREIGN KEY ("event_id")
          REFERENCES "events"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_favorites_user_event"
      ON "user_favorites" ("user_id", "event_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_favorites_user_created"
      ON "user_favorites" ("user_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_favorites"`);
  }
}
