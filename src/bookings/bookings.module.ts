import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booking } from './entities/booking.entity';
import { BookingRepository } from './booking.repository';
import { BookingService } from './booking.service';
import { BookingResolver } from './booking.resolver';
import { BookingMapper } from './booking.mapper';
import { PassengersModule } from '../passengers/passengers.module';
import { FlightsModule } from '../flights/flights.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    PassengersModule,
    FlightsModule,
    UsersModule,
    NotificationModule,
  ],
  providers: [
    BookingRepository,
    BookingService,
    BookingResolver,
    BookingMapper,
  ],
  exports: [BookingRepository, BookingService],
})
export class BookingsModule {}
