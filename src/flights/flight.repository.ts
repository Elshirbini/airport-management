import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';

import { resolvePagination } from '../common/utils/pagination.util';
import { Flight } from './entities/flight.entity';
import { FlightQueryInput } from './graphql/inputs/flight-query.input';

@Injectable()
export class FlightRepository {
  constructor(
    @InjectRepository(Flight)
    private readonly repository: Repository<Flight>,
  ) {}

  async create(data: Partial<Flight>): Promise<Flight> {
    const flight = this.repository.create(data);
    return this.repository.save(flight);
  }

  async findById(id: string): Promise<Flight | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByFlightNumber(flightNumber: string): Promise<Flight | null> {
    return this.repository.findOne({ where: { flightNumber } });
  }

  async findMany(
    query: FlightQueryInput,
    scopedAirportId?: string,
  ): Promise<{ flights: Flight[]; page: number; totalCount: number }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const qb = this.repository.createQueryBuilder('flight');

    if (scopedAirportId) {
      qb.andWhere(
        '(flight.departure_airport_id = :aid OR flight.destination_airport_id = :aid)',
        { aid: scopedAirportId },
      );
    }

    if (query.destinationAirportId) {
      qb.andWhere('flight.destination_airport_id = :dest', {
        dest: query.destinationAirportId,
      });
    }

    if (query.airline) {
      qb.andWhere('flight.airline ILIKE :airline', {
        airline: `%${query.airline}%`,
      });
    }

    if (query.departureTimeFrom) {
      qb.andWhere('flight.departure_time >= :from', {
        from: query.departureTimeFrom,
      });
    }

    if (query.departureTimeTo) {
      qb.andWhere('flight.departure_time <= :to', {
        to: query.departureTimeTo,
      });
    }

    qb.orderBy('flight.departure_time', 'ASC').skip(skip).take(limit);

    const [flights, totalCount] = await qb.getManyAndCount();
    return { flights, page, totalCount };
  }

  async save(flight: Flight): Promise<Flight> {
    return this.repository.save(flight);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }
}
