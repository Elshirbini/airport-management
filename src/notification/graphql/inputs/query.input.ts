import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

import { PaginationInput } from '../../../common/graphql/inputs/pagination.input';

@InputType()
export class QueryInput extends PaginationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
