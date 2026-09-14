import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAirportStaff1789393828097 implements MigrationInterface {
  name = 'CreateAdminAirportStaff1789393828097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "airport_admins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "airport_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a44720a930d3f058673e5585e7a" UNIQUE ("user_id"), CONSTRAINT "REL_a44720a930d3f058673e5585e7" UNIQUE ("user_id"), CONSTRAINT "PK_8c0eb127290d312be4fe0e0aba7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."staff_role_enum" AS ENUM('PILOT', 'CREW', 'GROUND_STAFF', 'SECURITY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "staff" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "airport_id" uuid NOT NULL, "role" "public"."staff_role_enum" NOT NULL, "assigned_flight_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_cec9365d9fc3a3409158b645f2e" UNIQUE ("user_id"), CONSTRAINT "REL_cec9365d9fc3a3409158b645f2" UNIQUE ("user_id"), CONSTRAINT "PK_e4ee98bb552756c180aec1e854a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('BOOKING_CONFIRMATION', 'FLIGHT_DELAY', 'welcome', 'otp-confirmation', 'reset-password')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "airport_admins" ADD CONSTRAINT "FK_a44720a930d3f058673e5585e7a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "airport_admins" ADD CONSTRAINT "FK_f395d500c1b0b1fbacb904fb46d" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "FK_cec9365d9fc3a3409158b645f2e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "FK_d2a2e11ac9b7e2099df78b36fcb" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT "FK_d2a2e11ac9b7e2099df78b36fcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT "FK_cec9365d9fc3a3409158b645f2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "airport_admins" DROP CONSTRAINT "FK_f395d500c1b0b1fbacb904fb46d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "airport_admins" DROP CONSTRAINT "FK_a44720a930d3f058673e5585e7a"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('BOOKING_CONFIRMATION', 'FLIGHT_DELAY', 'EMAIL_VERIFICATION', 'welcome', 'otp-confirmation', 'reset-password')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "staff"`);
    await queryRunner.query(`DROP TYPE "public"."staff_role_enum"`);
    await queryRunner.query(`DROP TABLE "airport_admins"`);
  }
}
