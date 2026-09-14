import { Field, ObjectType } from '@nestjs/graphql';

import { PaginationMeta } from '../../../common/graphql/types/pagination-meta.type';
import { AirportAdmin } from './airport-admin.type';

@ObjectType()
export class AirportAdminResponse {
  @Field(() => [AirportAdmin])
  airportAdmins!: AirportAdmin[];

  @Field(() => PaginationMeta)
  meta!: PaginationMeta;
}
