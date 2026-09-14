import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(16, { message: 'Password must not exceed 16 characters' })
  password!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  passportNumber!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  nationality!: string;
}
