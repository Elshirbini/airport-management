import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  password!: string;
}
