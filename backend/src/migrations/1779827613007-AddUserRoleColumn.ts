import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoleColumn1779827613007 implements MigrationInterface {
  name = "AddUserRoleColumn1779827613007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('CLIENT', 'PRODUCER', 'ADMIN')
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "role" "public"."users_role_enum" NOT NULL DEFAULT 'CLIENT'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
