import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionAuthGuard } from '../common/guards/subscription-auth.guard';
import { FlightService, FLIGHT_STATUS_UPDATED } from './flight.service';
import { Flight } from './graphql/types/flight.type';
import { FlightResponse } from './graphql/types/flight-response.type';
import { CreateFlightInput } from './graphql/inputs/create-flight.input';
import { UpdateFlightInput } from './graphql/inputs/update-flight.input';
import { FlightQueryInput } from './graphql/inputs/flight-query.input';
import { pubSub } from '../notification/pubsub';

@Resolver(() => Flight)
export class FlightResolver {
  constructor(private readonly flightService: FlightService) {}

  @UseGuards(AuthGuard)
  @Query(() => Flight)
  flight(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.flightService.getFlight(userId, id);
  }

  @UseGuards(AuthGuard)
  @Query(() => FlightResponse)
  flights(
    @CurrentUser() userId: string,
    @Args('query', { nullable: true, defaultValue: {} })
    query: FlightQueryInput,
  ) {
    return this.flightService.getFlights(userId, query);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Flight)
  createFlight(
    @CurrentUser() userId: string,
    @Args('input') input: CreateFlightInput,
  ) {
    return this.flightService.createFlight(userId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Flight)
  updateFlight(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFlightInput,
  ) {
    return this.flightService.updateFlight(userId, id, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Boolean)
  deleteFlight(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.flightService.deleteFlight(userId, id);
  }

  @UseGuards(SubscriptionAuthGuard)
  @Subscription(() => Flight, {
    name: FLIGHT_STATUS_UPDATED,
    filter(payload, variables) {
      return payload.flightStatusUpdated.id === variables.flightId;
    },
  })
  flightStatusUpdated(@Args('flightId', { type: () => ID }) flightId: string) {
    return pubSub.asyncIterableIterator(FLIGHT_STATUS_UPDATED);
  }
}
