import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AirportRepository } from './airport.repository';
import { CreateAirportInput } from './graphql/inputs/create-airport.input';
import { UpdateAirportInput } from './graphql/inputs/update-airport.input';
import { AirportQueryInput } from './graphql/inputs/airport-query.input';
import { Airport as GraphQLAirport } from './graphql/types/airport.type';
import { Airport as DBAirport } from './entities/airport.entity';
import { AirportResponse } from './graphql/types/airport-response.type';

@Injectable()
export class AirportService {
  constructor(
    private readonly airportRepository: AirportRepository,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async getAirports(query: AirportQueryInput): Promise<AirportResponse> {
    const { airports, page, totalCount } =
      await this.airportRepository.getAirports(query);

    const mappedAirports = await this.mapper.mapArrayAsync(
      airports,
      DBAirport,
      GraphQLAirport,
    );

    return {
      airports: mappedAirports,
      meta: {
        page,
        totalCount,
      },
    };
  }

  async getAirport(id: string): Promise<GraphQLAirport> {
    const airport = await this.airportRepository.findAirportById(id);
    if (!airport) {
      throw new NotFoundException('Airport not found');
    }

    return this.mapper.mapAsync(airport, DBAirport, GraphQLAirport);
  }

  async createAirport(input: CreateAirportInput): Promise<GraphQLAirport> {
    const existing = await this.airportRepository.findAirportByCode(input.code);
    if (existing) {
      throw new ConflictException('Airport code already exists');
    }

    const created = await this.airportRepository.createAirport(input);
    return this.mapper.mapAsync(created, DBAirport, GraphQLAirport);
  }

  async updateAirport(
    id: string,
    input: UpdateAirportInput,
  ): Promise<GraphQLAirport> {
    const airport = await this.airportRepository.findAirportById(id);
    if (!airport) {
      throw new NotFoundException('Airport not found');
    }

    if (input.code && input.code !== airport.code) {
      const existing = await this.airportRepository.findAirportByCode(
        input.code,
      );
      if (existing) {
        throw new ConflictException('Airport code already exists');
      }
    }

    Object.assign(airport, input);
    const updated = await this.airportRepository.saveAirport(airport);

    return this.mapper.mapAsync(updated, DBAirport, GraphQLAirport);
  }

  async deleteAirport(id: string): Promise<boolean> {
    const airport = await this.airportRepository.findAirportById(id);
    if (!airport) {
      throw new NotFoundException('Airport not found');
    }

    return this.airportRepository.deleteAirport(id);
  }
}
