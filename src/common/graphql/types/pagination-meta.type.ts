import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaginationMeta {
  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  totalCount!: number;
}
