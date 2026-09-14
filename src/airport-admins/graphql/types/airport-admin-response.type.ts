import { Field, ObjectType } from '@nestjs/graphql';
import { AirportAdmin } from './airport-admin.type';

@ObjectType()
class AirportAdminMeta {
  @Field()
  totalCount!: number;
}

@ObjectType()
export class AirportAdminResponse {
  @Field(() => [AirportAdmin])
  airportAdmins!: AirportAdmin[];

  @Field(() => AirportAdminMeta)
  meta!: AirportAdminMeta;
}
