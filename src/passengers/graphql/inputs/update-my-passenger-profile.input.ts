import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateMyPassengerProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  passportNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nationality?: string;
}
