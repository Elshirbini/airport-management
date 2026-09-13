import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateAirportInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  city!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  country!: string;
}
