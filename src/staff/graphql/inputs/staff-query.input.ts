import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsOptional } from 'class-validator';

@InputType()
export class StaffQueryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  limit?: number;
}
