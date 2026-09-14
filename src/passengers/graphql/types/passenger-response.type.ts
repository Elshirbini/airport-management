import { Field, ObjectType } from '@nestjs/graphql';

import { PaginationMeta } from '../../../common/graphql/types/pagination-meta.type';
import { Passenger } from './passenger.type';

@ObjectType()
export class PassengerResponse {
  @Field(() => [Passenger])
  passengers!: Passenger[];

  @Field(() => PaginationMeta)
  meta!: PaginationMeta;
}
