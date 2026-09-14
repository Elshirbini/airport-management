import { Field, ObjectType } from '@nestjs/graphql';

import { PaginationMeta } from '../../../common/graphql/types/pagination-meta.type';
import { Booking } from './booking.type';

@ObjectType()
export class BookingResponse {
  @Field(() => [Booking])
  bookings!: Booking[];

  @Field(() => PaginationMeta)
  meta!: PaginationMeta;
}
