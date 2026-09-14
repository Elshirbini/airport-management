import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { AirportAdminService } from './airport-admin.service';
import { AirportAdmin } from './graphql/types/airport-admin.type';
import { AirportAdminResponse } from './graphql/types/airport-admin-response.type';
import { CreateAirportAdminInput } from './graphql/inputs/create-airport-admin.input';
import { AirportAdminQueryInput } from './graphql/inputs/airport-admin-query.input';

@Resolver(() => AirportAdmin)
export class AirportAdminResolver {
  constructor(private readonly airportAdminService: AirportAdminService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Query(() => AirportAdminResponse)
  airportAdmins(
    @CurrentUser() userId: string,
    @Args('input', { nullable: true, defaultValue: {} })
    input: AirportAdminQueryInput,
  ) {
    return this.airportAdminService.getAirportAdmins(userId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Query(() => AirportAdmin)
  airportAdmin(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.airportAdminService.getAirportAdmin(userId, id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => AirportAdmin)
  createAirportAdmin(
    @CurrentUser() userId: string,
    @Args('input') input: CreateAirportAdminInput,
  ) {
    return this.airportAdminService.createAirportAdmin(userId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Boolean)
  deleteAirportAdmin(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.airportAdminService.deleteAirportAdmin(userId, id);
  }
}
