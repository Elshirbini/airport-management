import { InputType, PartialType } from '@nestjs/graphql';
import { CreateAirportInput } from './create-airport.input';

@InputType()
export class UpdateAirportInput extends PartialType(CreateAirportInput) {}
