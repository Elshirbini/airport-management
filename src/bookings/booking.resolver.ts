import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { BookingService } from './booking.service';
import { Booking } from './graphql/types/booking.type';
import { BookingResponse } from './graphql/types/booking-response.type';
import { CreateBookingInput } from './graphql/inputs/create-booking.input';
import { BookingQueryInput } from './graphql/inputs/booking-query.input';
import { Flight } from '../flights/graphql/types/flight.type';

@Resolver(() => Booking)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PASSENGER')
  @Query(() => BookingResponse)
  bookings(
    @CurrentUser() userId: string,
    @Args('query', { nullable: true, defaultValue: {} })
    query: BookingQueryInput,
  ) {
    return this.bookingService.getBookings(userId, query);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PASSENGER')
  @Query(() => Booking)
  booking(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.bookingService.getBooking(userId, id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PASSENGER')
  @Mutation(() => Booking)
  createBooking(
    @CurrentUser() userId: string,
    @Args('input') input: CreateBookingInput,
  ) {
    return this.bookingService.createBooking(userId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PASSENGER')
  @Mutation(() => Booking)
  cancelBooking(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.bookingService.cancelBooking(userId, id);
  }

  @ResolveField(() => Flight, { nullable: true })
  flight(@Parent() booking: Booking) {
    return this.bookingService.resolveFlight(booking.flightId);
  }
}
