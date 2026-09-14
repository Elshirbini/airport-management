import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { resolvePagination } from '../common/utils/pagination.util';
import { Booking, BookingStatus } from './entities/booking.entity';
import { BookingQueryInput } from './graphql/inputs/booking-query.input';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(
    data: Partial<Booking>,
    manager?: EntityManager,
  ): Promise<Booking> {
    const repo = manager
      ? manager.getRepository(Booking)
      : this.bookingRepository;
    const booking = repo.create(data);
    return repo.save(booking);
  }

  async findBookingById(id: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { id } });
  }

  async findBookingByIdAndPassengerId(
    id: string,
    passengerId: string,
  ): Promise<Booking | null> {
    return this.bookingRepository.findOne({
      where: { id, passengerId },
    });
  }

  async getBookingsByPassengerId(
    passengerId: string,
    query: BookingQueryInput,
  ): Promise<{ bookings: Booking[]; page: number; totalCount: number }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const [bookings, totalCount] = await this.bookingRepository.findAndCount({
      where: { passengerId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { bookings, page, totalCount };
  }

  async saveBooking(booking: Booking): Promise<Booking> {
    return this.bookingRepository.save(booking);
  }

  async existsConfirmedBookingForSeat(
    flightId: string,
    seatNumber: number,
    manager: EntityManager,
  ): Promise<boolean> {
    const count = await manager.count(Booking, {
      where: {
        flightId,
        seatNumber,
        status: BookingStatus.CONFIRMED,
      },
    });
    return count > 0;
  }
}
