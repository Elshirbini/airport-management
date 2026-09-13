import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

@InputType()
export class QueryInput {
  @Field()
  @IsOptional()
  @IsInt()
  limit?: number;

  @Field()
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
