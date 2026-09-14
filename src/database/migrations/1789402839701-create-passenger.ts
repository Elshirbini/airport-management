import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePassenger1789402839701 implements MigrationInterface {
    name = 'CreatePassenger1789402839701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "passengers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "passport_number" character varying NOT NULL, "nationality" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_aa4b8df12b1dbb9e57af44f7af8" UNIQUE ("user_id"), CONSTRAINT "UQ_ddf00be41495a35203b936e1c7f" UNIQUE ("passport_number"), CONSTRAINT "REL_aa4b8df12b1dbb9e57af44f7af" UNIQUE ("user_id"), CONSTRAINT "PK_9863c72acd866e4529f65c6c98c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "passengers" ADD CONSTRAINT "FK_aa4b8df12b1dbb9e57af44f7af8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "passengers" DROP CONSTRAINT "FK_aa4b8df12b1dbb9e57af44f7af8"`);
        await queryRunner.query(`DROP TABLE "passengers"`);
    }

}
