import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

import { BookingRepository } from './booking.repository';
import { PassengerRepository } from '../passengers/passenger.repository';
import { FlightRepository } from '../flights/flight.repository';
import { UsersRepository } from '../users/users.repository';
import { Booking as DBBooking, BookingStatus } from './entities/booking.entity';
import { Booking as GraphQLBooking } from './graphql/types/booking.type';
import { BookingResponse } from './graphql/types/booking-response.type';
import { CreateBookingInput } from './graphql/inputs/create-booking.input';
import { BookingQueryInput } from './graphql/inputs/booking-query.input';
import { UserRole } from '../users/entities/user.entity';
import {
  Flight as DBFlight,
  FlightStatus,
} from '../flights/entities/flight.entity';
import { Flight as GraphQLFlight } from '../flights/graphql/types/flight.type';
import { NotificationService } from '../notification/notification.service';
import {
  NotificationChannel,
  NotificationType,
} from '../notification/enums/notification.enums';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly passengerRepository: PassengerRepository,
    private readonly flightRepository: FlightRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  private async resolvePassengerFromUser(userId: string) {
    const currentUser = await this.usersRepository.findById(userId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role !== UserRole.PASSENGER) {
      throw new ForbiddenException('Only passengers can manage bookings.');
    }

    const passenger =
      await this.passengerRepository.findPassengerByUserId(userId);
    if (!passenger) {
      throw new NotFoundException('Passenger profile not found');
    }

    return passenger;
  }

  private validateSeatNumber(seatNumber: number, flight: DBFlight): void {
    if (seatNumber < 1) {
      throw new BadRequestException('Seat number must be at least 1.');
    }

    if (seatNumber > flight.availableSeats) {
      throw new BadRequestException(
        `Seat number must not exceed ${flight.availableSeats}.`,
      );
    }
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === '23505'
    );
  }

  async getBookings(
    currentUserId: string,
    query: BookingQueryInput,
  ): Promise<BookingResponse> {
    const passenger = await this.resolvePassengerFromUser(currentUserId);

    const { bookings, page, totalCount } =
      await this.bookingRepository.getBookingsByPassengerId(
        passenger.id,
        query,
      );

    const mappedBookings = await this.mapper.mapArrayAsync(
      bookings,
      DBBooking,
      GraphQLBooking,
    );

    return {
      bookings: mappedBookings,
      meta: { page, totalCount },
    };
  }

  async getBooking(
    currentUserId: string,
    bookingId: string,
  ): Promise<GraphQLBooking> {
    const passenger = await this.resolvePassengerFromUser(currentUserId);

    const booking = await this.bookingRepository.findBookingByIdAndPassengerId(
      bookingId,
      passenger.id,
    );
    if (!booking) {
      const exists = await this.bookingRepository.findBookingById(bookingId);
      if (exists) {
        throw new ForbiddenException('You can only view your own bookings.');
      }
      throw new NotFoundException('Booking not found');
    }

    return this.mapper.mapAsync(booking, DBBooking, GraphQLBooking);
  }

  async createBooking(
    currentUserId: string,
    input: CreateBookingInput,
  ): Promise<GraphQLBooking> {
    const passenger = await this.resolvePassengerFromUser(currentUserId);

    const flight = await this.flightRepository.findById(input.flightId);
    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    if (flight.status === FlightStatus.CANCELED) {
      throw new BadRequestException('Cannot book a seat on a canceled flight.');
    }

    this.validateSeatNumber(input.seatNumber, flight);

    let saved: DBBooking;
    let lockedFlight: DBFlight;

    try {
      ({ saved, lockedFlight } = await this.dataSource.manager.transaction(
        async (manager) => {
          const flight = await manager.findOne(DBFlight, {
            where: { id: input.flightId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!flight) {
            throw new NotFoundException('Flight not found');
          }

          if (flight.status === FlightStatus.CANCELED) {
            throw new BadRequestException(
              'Cannot book a seat on a canceled flight.',
            );
          }

          this.validateSeatNumber(input.seatNumber, flight);

          const seatTaken =
            await this.bookingRepository.existsConfirmedBookingForSeat(
              input.flightId,
              input.seatNumber,
              manager,
            );

          if (seatTaken) {
            throw new ConflictException(
              `Seat ${input.seatNumber} is already booked on this flight.`,
            );
          }

          const booking = await this.bookingRepository.createBooking(
            {
              passengerId: passenger.id,
              flightId: input.flightId,
              seatNumber: input.seatNumber,
              status: BookingStatus.CONFIRMED,
            },
            manager,
          );

          return { saved: booking, lockedFlight: flight };
        },
      ));
    } catch (err) {
      if (this.isUniqueConstraintViolation(err)) {
        throw new ConflictException(
          `Seat ${input.seatNumber} is already booked on this flight.`,
        );
      }

      throw err;
    }

    const mapped = await this.mapper.mapAsync(saved, DBBooking, GraphQLBooking);

    await this.sendBookingConfirmationEmail(
      currentUserId,
      passenger.name,
      saved,
      lockedFlight,
    );

    return mapped;
  }

  async cancelBooking(
    currentUserId: string,
    bookingId: string,
  ): Promise<GraphQLBooking> {
    const passenger = await this.resolvePassengerFromUser(currentUserId);

    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.passengerId !== passenger.id) {
      throw new ForbiddenException('You can only cancel your own bookings.');
    }

    if (booking.status === BookingStatus.CANCELED) {
      throw new BadRequestException('Booking is already canceled.');
    }

    booking.status = BookingStatus.CANCELED;
    const updated = await this.bookingRepository.saveBooking(booking);
    return this.mapper.mapAsync(updated, DBBooking, GraphQLBooking);
  }

  async resolveFlight(flightId: string): Promise<GraphQLFlight | null> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) return null;
    return this.mapper.mapAsync(flight, DBFlight, GraphQLFlight);
  }

  private async sendBookingConfirmationEmail(
    userId: string,
    passengerName: string,
    booking: DBBooking,
    flight: DBFlight,
  ): Promise<void> {
    try {
      const user = await this.usersRepository.findById(userId);
      if (!user) return;

      await this.notificationService.send({
        userId,
        title: 'Booking Confirmed',
        body: `Your booking for flight ${flight.flightNumber}, seat ${booking.seatNumber}, is confirmed.`,
        type: NotificationType.BOOKING_CONFIRMATION,
        channels: [NotificationChannel.EMAIL],
        data: {
          to: user.email,
          passengerName,
          bookingId: booking.id,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          seatNumber: booking.seatNumber,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to send booking confirmation email for booking ${booking.id}`,
        err,
      );
    }
  }
}
