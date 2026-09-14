import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationInput } from '../../../common/graphql/inputs/pagination.input';

@InputType()
export class FlightQueryInput extends PaginationInput {
  @Field({ nullable: true })
  @IsOptional()
  departureTimeFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  departureTimeTo?: Date;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  destinationAirportId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  airline?: string;
}
