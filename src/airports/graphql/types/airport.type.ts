import { AutoMap } from '@automapper/classes';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Airport {
  @AutoMap()
  @Field(() => ID)
  id!: string;

  @AutoMap()
  @Field()
  name!: string;

  @AutoMap()
  @Field()
  code!: string;

  @AutoMap()
  @Field()
  city!: string;

  @AutoMap()
  @Field()
  country!: string;

  @AutoMap()
  @Field()
  createdAt!: Date;

  @AutoMap()
  @Field()
  updatedAt!: Date;
}
