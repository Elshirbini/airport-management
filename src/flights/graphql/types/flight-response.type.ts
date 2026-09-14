import { Field, ObjectType } from '@nestjs/graphql';

import { PaginationMeta } from '../../../common/graphql/types/pagination-meta.type';
import { Flight } from './flight.type';

@ObjectType()
export class FlightResponse {
  @Field(() => [Flight])
  flights!: Flight[];

  @Field(() => PaginationMeta)
  meta!: PaginationMeta;
}
