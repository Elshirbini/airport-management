import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { PassengerService } from './passenger.service';
import { Passenger } from './graphql/types/passenger.type';
import { PassengerResponse } from './graphql/types/passenger-response.type';
import { UpdatePassengerInput } from './graphql/inputs/update-passenger.input';
import { UpdateMyPassengerProfileInput } from './graphql/inputs/update-my-passenger-profile.input';
import { PassengerQueryInput } from './graphql/inputs/passenger-query.input';

@Resolver(() => Passenger)
export class PassengerResolver {
  constructor(private readonly passengerService: PassengerService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Query(() => PassengerResponse)
  passengers(
    @CurrentUser() userId: string,
    @Args('query', { nullable: true, defaultValue: {} })
    query: PassengerQueryInput,
  ) {
    return this.passengerService.getPassengers(userId, query);
  }

  @UseGuards(AuthGuard)
  @Query(() => Passenger)
  passenger(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.passengerService.getPassenger(userId, id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Mutation(() => Passenger)
  updatePassenger(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePassengerInput,
  ) {
    return this.passengerService.updatePassenger(userId, id, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PASSENGER')
  @Mutation(() => Passenger)
  updateMyPassengerProfile(
    @CurrentUser() userId: string,
    @Args('input') input: UpdateMyPassengerProfileInput,
  ) {
    return this.passengerService.updateMyPassengerProfile(userId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Mutation(() => Boolean)
  deletePassenger(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.passengerService.deletePassenger(userId, id);
  }
}
