import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { FlightStatus } from '../../entities/flight.entity';

@InputType()
export class CreateFlightInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  flightNumber!: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  departureAirportId!: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  destinationAirportId!: string;

  @Field()
  @IsNotEmpty()
  departureTime!: Date;

  @Field()
  @IsNotEmpty()
  arrivalTime!: Date;

  @Field()
  @IsString()
  @IsNotEmpty()
  airline!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  availableSeats!: number;

  @Field(() => FlightStatus, { nullable: true })
  @IsEnum(FlightStatus)
  status?: FlightStatus;
}
