import { Field, ObjectType } from '@nestjs/graphql';

import { PaginationMeta } from '../../../common/graphql/types/pagination-meta.type';
import { Airport } from './airport.type';

@ObjectType()
export class AirportResponse {
  @Field(() => [Airport])
  airports!: Airport[];

  @Field(() => PaginationMeta)
  meta!: PaginationMeta;
}
