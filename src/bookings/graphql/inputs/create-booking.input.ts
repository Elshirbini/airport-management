import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID, Min } from 'class-validator';

@InputType()
export class CreateBookingInput {
  @Field(() => ID)
  @IsUUID()
  flightId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  seatNumber!: number;
}
