import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { resolvePagination } from '../common/utils/pagination.util';
import { Airport } from './entities/airport.entity';
import { AirportQueryInput } from './graphql/inputs/airport-query.input';

@Injectable()
export class AirportRepository {
  constructor(
    @InjectRepository(Airport)
    private readonly airportRepository: Repository<Airport>,
  ) {}

  async createAirport(airportData: Partial<Airport>): Promise<Airport> {
    const airport = this.airportRepository.create(airportData);
    return this.airportRepository.save(airport);
  }

  async getAirports(query: AirportQueryInput): Promise<{
    airports: Airport[];
    page: number;
    totalCount: number;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const [airports, totalCount] = await this.airportRepository.findAndCount({
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      airports,
      page,
      totalCount,
    };
  }

  async findAirportById(id: string): Promise<Airport | null> {
    return this.airportRepository.findOne({
      where: { id },
    });
  }

  async findAirportByCode(code: string): Promise<Airport | null> {
    return this.airportRepository.findOne({
      where: { code },
    });
  }

  async saveAirport(airport: Airport): Promise<Airport> {
    return this.airportRepository.save(airport);
  }

  async deleteAirport(id: string): Promise<boolean> {
    const result = await this.airportRepository.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }
}
