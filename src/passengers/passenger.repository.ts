import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { resolvePagination } from '../common/utils/pagination.util';
import { Passenger } from './entities/passenger.entity';
import { PassengerQueryInput } from './graphql/inputs/passenger-query.input';

@Injectable()
export class PassengerRepository {
  constructor(
    @InjectRepository(Passenger)
    private readonly passengerRepository: Repository<Passenger>,
  ) {}

  async createPassenger(passengerData: Partial<Passenger>): Promise<Passenger> {
    const passenger = this.passengerRepository.create(passengerData);
    return this.passengerRepository.save(passenger);
  }

  async getPassengers(query: PassengerQueryInput): Promise<{
    passengers: Passenger[];
    page: number;
    totalCount: number;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const [passengers, totalCount] =
      await this.passengerRepository.findAndCount({
        order: {
          createdAt: 'DESC',
        },
        skip,
        take: limit,
      });

    return {
      passengers,
      page,
      totalCount,
    };
  }

  async findPassengerById(id: string): Promise<Passenger | null> {
    return this.passengerRepository.findOne({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<Passenger[]> {
    if (!ids || ids.length === 0) return [];
    return this.passengerRepository.find({
      where: { id: In(ids) },
    });
  }

  async findPassengerByUserId(userId: string): Promise<Passenger | null> {
    return this.passengerRepository.findOne({
      where: { userId },
    });
  }

  async findPassengerByPassportNumber(
    passportNumber: string,
  ): Promise<Passenger | null> {
    return this.passengerRepository.findOne({
      where: { passportNumber },
    });
  }

  async savePassenger(passenger: Passenger): Promise<Passenger> {
    return this.passengerRepository.save(passenger);
  }

  async deletePassenger(id: string): Promise<boolean> {
    const result = await this.passengerRepository.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }
}
