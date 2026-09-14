import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { StaffRole } from '../../entities/staff.entity';

@InputType()
export class CreateStaffInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  airportId?: string;

  @Field(() => StaffRole)
  @IsEnum(StaffRole)
  @IsNotEmpty()
  role!: StaffRole;
}
