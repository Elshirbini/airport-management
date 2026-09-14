import { Field, ObjectType } from '@nestjs/graphql';

import { PaginationMeta } from '../../../common/graphql/types/pagination-meta.type';
import { Staff } from './staff.type';

@ObjectType()
export class StaffResponse {
  @Field(() => [Staff])
  staffs!: Staff[];

  @Field(() => PaginationMeta)
  meta!: PaginationMeta;
}
