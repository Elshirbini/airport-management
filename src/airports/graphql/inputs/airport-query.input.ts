import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsOptional } from 'class-validator';

@InputType()
export class AirportQueryInput {
  @Field()
  @IsOptional()
  @IsInt()
  limit?: number;
}
