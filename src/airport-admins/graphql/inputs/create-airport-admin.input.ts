import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateAirportAdminInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(16, { message: 'Password must not exceed 16 characters' })
  password!: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  airportId?: string;
}
