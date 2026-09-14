import { AutoMap } from '@automapper/classes';
import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { BookingStatus } from '../../entities/booking.entity';
import { Flight } from '../../../flights/graphql/types/flight.type';

registerEnumType(BookingStatus, {
  name: 'BookingStatus',
  description: 'Status of a booking',
});

@ObjectType()
export class Booking {
  @AutoMap()
  @Field(() => ID)
  id!: string;

  @AutoMap()
  @Field(() => ID)
  passengerId!: string;

  @AutoMap()
  @Field(() => ID)
  flightId!: string;

  @AutoMap()
  @Field(() => Int)
  seatNumber!: number;

  @AutoMap()
  @Field(() => BookingStatus)
  status!: BookingStatus;

  @AutoMap()
  @Field()
  createdAt!: Date;

  @AutoMap()
  @Field()
  updatedAt!: Date;

  @Field(() => Flight, { nullable: true })
  flight?: Flight;
}
