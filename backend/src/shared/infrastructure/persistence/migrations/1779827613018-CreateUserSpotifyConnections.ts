import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserSpotifyConnections1779827613018 implements MigrationInterface {
  name = "CreateUserSpotifyConnections1779827613018";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_spotify_connections" (
        "user_id" uuid NOT NULL,
        "spotify_user_id" varchar(128) NOT NULL,
        "display_name" varchar(255),
        "access_token" text NOT NULL,
        "refresh_token" text NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "scope" varchar(512) NOT NULL,
        CONSTRAINT "PK_user_spotify_connections" PRIMARY KEY ("user_id"),
        CONSTRAINT "FK_user_spotify_connections_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_spotify_connections"`);
  }
}
