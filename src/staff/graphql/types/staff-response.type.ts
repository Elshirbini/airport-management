import { Field, ObjectType } from '@nestjs/graphql';
import { Staff } from './staff.type';

@ObjectType()
class StaffMeta {
  @Field()
  totalCount!: number;
}

@ObjectType()
export class StaffResponse {
  @Field(() => [Staff])
  staffs!: Staff[];

  @Field(() => StaffMeta)
  meta!: StaffMeta;
}
