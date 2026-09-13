import { Field, ObjectType } from '@nestjs/graphql';
import { Airport } from './airport.type';

@ObjectType()
class AirportMeta {
  @Field()
  totalCount!: number;
}

@ObjectType()
export class AirportResponse {
  @Field(() => [Airport])
  airports!: Airport[];

  @Field(() => AirportMeta)
  meta!: AirportMeta;
}
