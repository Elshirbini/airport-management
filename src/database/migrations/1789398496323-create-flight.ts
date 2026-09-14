import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlight1789398496323 implements MigrationInterface {
  name = 'CreateFlight1789398496323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."flights_status_enum" AS ENUM('ON_TIME', 'DELAYED', 'CANCELED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "flights" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "flight_number" character varying NOT NULL, "departure_airport_id" uuid NOT NULL, "destination_airport_id" uuid NOT NULL, "departure_time" TIMESTAMP WITH TIME ZONE NOT NULL, "arrival_time" TIMESTAMP WITH TIME ZONE NOT NULL, "airline" character varying NOT NULL, "available_seats" integer NOT NULL, "status" "public"."flights_status_enum" NOT NULL DEFAULT 'ON_TIME', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6e770fde8f0a57231f44434eb75" UNIQUE ("flight_number"), CONSTRAINT "PK_c614ef3382fdd70b6d6c2c8d8dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "flights" ADD CONSTRAINT "FK_7ce4f1631dfb4a6137bbb87654d" FOREIGN KEY ("departure_airport_id") REFERENCES "airports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flights" ADD CONSTRAINT "FK_d5ec119a04387b1602c13dd9f1e" FOREIGN KEY ("destination_airport_id") REFERENCES "airports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flights" DROP CONSTRAINT "FK_d5ec119a04387b1602c13dd9f1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flights" DROP CONSTRAINT "FK_7ce4f1631dfb4a6137bbb87654d"`,
    );
    await queryRunner.query(`DROP TABLE "flights"`);
    await queryRunner.query(`DROP TYPE "public"."flights_status_enum"`);
  }
}
