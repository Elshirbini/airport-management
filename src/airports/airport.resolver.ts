import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { AirportService } from './airport.service';
import { Airport } from './graphql/types/airport.type';
import { AirportResponse } from './graphql/types/airport-response.type';
import { CreateAirportInput } from './graphql/inputs/create-airport.input';
import { UpdateAirportInput } from './graphql/inputs/update-airport.input';
import { AirportQueryInput } from './graphql/inputs/airport-query.input';

@Resolver(() => Airport)
export class AirportResolver {
  constructor(private readonly airportService: AirportService) {}

  @UseGuards(AuthGuard)
  @Query(() => AirportResponse)
  airports(
    @Args('input', { nullable: true, defaultValue: {} })
    input: AirportQueryInput,
  ) {
    return this.airportService.getAirports(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Airport)
  airport(@Args('id', { type: () => ID }) id: string) {
    return this.airportService.getAirport(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Mutation(() => Airport)
  createAirport(@Args('input') input: CreateAirportInput) {
    return this.airportService.createAirport(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Mutation(() => Airport)
  updateAirport(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAirportInput,
  ) {
    return this.airportService.updateAirport(id, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Mutation(() => Boolean)
  deleteAirport(@Args('id', { type: () => ID }) id: string) {
    return this.airportService.deleteAirport(id);
  }
}
