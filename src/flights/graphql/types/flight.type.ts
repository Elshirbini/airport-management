import { AutoMap } from '@automapper/classes';
import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { FlightStatus } from '../../entities/flight.entity';

registerEnumType(FlightStatus, {
  name: 'FlightStatus',
});

@ObjectType()
export class Flight {
  @AutoMap()
  @Field(() => ID)
  id!: string;

  @AutoMap()
  @Field()
  flightNumber!: string;

  @AutoMap()
  @Field(() => ID)
  departureAirportId!: string;

  @AutoMap()
  @Field(() => ID)
  destinationAirportId!: string;

  @AutoMap()
  @Field()
  departureTime!: Date;

  @AutoMap()
  @Field()
  arrivalTime!: Date;

  @AutoMap()
  @Field()
  airline!: string;

  @AutoMap()
  @Field(() => Int)
  availableSeats!: number;

  @AutoMap()
  @Field(() => FlightStatus)
  status!: FlightStatus;

  @AutoMap()
  @Field()
  createdAt!: Date;

  @AutoMap()
  @Field()
  updatedAt!: Date;
}
