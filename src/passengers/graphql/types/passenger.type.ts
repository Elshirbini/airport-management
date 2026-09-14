import { AutoMap } from '@automapper/classes';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Passenger {
  @AutoMap()
  @Field(() => ID)
  id!: string;

  @AutoMap()
  @Field(() => ID)
  userId!: string;

  @AutoMap()
  @Field()
  name!: string;

  @AutoMap()
  @Field()
  passportNumber!: string;

  @AutoMap()
  @Field()
  nationality!: string;

  @AutoMap()
  @Field()
  createdAt!: Date;

  @AutoMap()
  @Field()
  updatedAt!: Date;
}
