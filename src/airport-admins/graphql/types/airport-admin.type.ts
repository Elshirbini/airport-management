import { AutoMap } from '@automapper/classes';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AirportAdmin {
  @AutoMap()
  @Field(() => ID)
  id!: string;

  @AutoMap()
  @Field(() => ID)
  userId!: string;

  @AutoMap()
  @Field(() => ID)
  airportId!: string;

  @AutoMap()
  @Field()
  createdAt!: Date;

  @AutoMap()
  @Field()
  updatedAt!: Date;
}
