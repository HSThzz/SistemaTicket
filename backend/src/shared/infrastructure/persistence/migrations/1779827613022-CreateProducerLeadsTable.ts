import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProducerLeadsTable1779827613022 implements MigrationInterface {
  name = "CreateProducerLeadsTable1779827613022";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "producer_leads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(32),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_producer_leads" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_producer_leads_created_at"
      ON "producer_leads" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_producer_leads_email"
      ON "producer_leads" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "producer_leads"`);
  }
}
