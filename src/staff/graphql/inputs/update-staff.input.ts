import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { StaffRole } from '../../entities/staff.entity';

@InputType()
export class UpdateStaffInput {
  @Field(() => StaffRole, { nullable: true })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;
}
