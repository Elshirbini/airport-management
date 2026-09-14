import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { FlightRepository } from './flight.repository';
import { AirportRepository } from '../airports/airport.repository';
import { AirportAdminRepository } from '../airport-admins/airport-admin.repository';
import { UsersRepository } from '../users/users.repository';
import { Flight as DBFlight } from './entities/flight.entity';
import { Flight as GraphQLFlight } from './graphql/types/flight.type';
import { FlightResponse } from './graphql/types/flight-response.type';
import { UserRole } from '../users/entities/user.entity';
import { CreateFlightInput } from './graphql/inputs/create-flight.input';
import { UpdateFlightInput } from './graphql/inputs/update-flight.input';
import { FlightQueryInput } from './graphql/inputs/flight-query.input';
import { pubSub } from '../notification/pubsub';

export const FLIGHT_STATUS_UPDATED = 'FLIGHT_STATUS_UPDATED';

@Injectable()
export class FlightService {
  constructor(
    private readonly flightRepository: FlightRepository,
    private readonly airportRepository: AirportRepository,
    private readonly airportAdminRepository: AirportAdminRepository,
    private readonly usersRepository: UsersRepository,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  private async getAdminAirportId(userId: string): Promise<string> {
    const admin = await this.airportAdminRepository.findByUserId(userId);
    if (!admin) {
      throw new ForbiddenException(
        'AIRPORT_ADMIN user must have an associated AirportAdmin record.',
      );
    }
    return admin.airportId;
  }

  private flightInvolvesAirport(flight: DBFlight, airportId: string): boolean {
    return (
      flight.departureAirportId === airportId ||
      flight.destinationAirportId === airportId
    );
  }

  private async validateFlightBusinessRules(
    departureAirportId: string,
    destinationAirportId: string,
    departureTime: Date,
    arrivalTime: Date,
    availableSeats: number,
  ): Promise<void> {
    if (departureAirportId === destinationAirportId) {
      throw new BadRequestException(
        'Departure and destination airports cannot be the same.',
      );
    }

    if (departureTime >= arrivalTime) {
      throw new BadRequestException(
        'Departure time must be before arrival time.',
      );
    }

    if (availableSeats < 0) {
      throw new BadRequestException('Available seats cannot be negative.');
    }

    const [depAirport, destAirport] = await Promise.all([
      this.airportRepository.findAirportById(departureAirportId),
      this.airportRepository.findAirportById(destinationAirportId),
    ]);

    if (!depAirport) {
      throw new NotFoundException(
        `Departure airport not found: ${departureAirportId}`,
      );
    }
    if (!destAirport) {
      throw new NotFoundException(
        `Destination airport not found: ${destinationAirportId}`,
      );
    }
  }

  async createFlight(
    currentUserId: string,
    input: CreateFlightInput,
  ): Promise<GraphQLFlight> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.AIRPORT_ADMIN
    ) {
      throw new ForbiddenException();
    }

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (
        input.departureAirportId !== adminAirportId &&
        input.destinationAirportId !== adminAirportId
      ) {
        throw new ForbiddenException(
          'Flight must involve your airport as departure or destination.',
        );
      }
    }

    await this.validateFlightBusinessRules(
      input.departureAirportId,
      input.destinationAirportId,
      input.departureTime,
      input.arrivalTime,
      input.availableSeats,
    );

    const existing = await this.flightRepository.findByFlightNumber(
      input.flightNumber,
    );
    if (existing) {
      throw new ConflictException(
        `Flight number '${input.flightNumber}' already exists.`,
      );
    }

    const created = await this.flightRepository.create({
      flightNumber: input.flightNumber,
      departureAirportId: input.departureAirportId,
      destinationAirportId: input.destinationAirportId,
      departureTime: input.departureTime,
      arrivalTime: input.arrivalTime,
      airline: input.airline,
      availableSeats: input.availableSeats,
      status: input.status ?? undefined,
    });

    return this.mapper.mapAsync(created, DBFlight, GraphQLFlight);
  }

  async updateFlight(
    currentUserId: string,
    flightId: string,
    input: UpdateFlightInput,
  ): Promise<GraphQLFlight> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    const flight = await this.flightRepository.findById(flightId);
    if (!flight) throw new NotFoundException('Flight not found');

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (!this.flightInvolvesAirport(flight, adminAirportId)) {
        throw new ForbiddenException(
          'You can only update flights involving your airport.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    const updatedDep = input.departureAirportId ?? flight.departureAirportId;
    const updatedDest =
      input.destinationAirportId ?? flight.destinationAirportId;
    const updatedDepTime = input.departureTime ?? flight.departureTime;
    const updatedArrTime = input.arrivalTime ?? flight.arrivalTime;
    const updatedSeats = input.availableSeats ?? flight.availableSeats;

    await this.validateFlightBusinessRules(
      updatedDep,
      updatedDest,
      updatedDepTime,
      updatedArrTime,
      updatedSeats,
    );

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (updatedDep !== adminAirportId && updatedDest !== adminAirportId) {
        throw new ForbiddenException(
          'The updated flight must still involve your airport.',
        );
      }
    }

    if (input.flightNumber && input.flightNumber !== flight.flightNumber) {
      const conflict = await this.flightRepository.findByFlightNumber(
        input.flightNumber,
      );
      if (conflict) {
        throw new ConflictException(
          `Flight number '${input.flightNumber}' already exists.`,
        );
      }
    }

    const previousStatus = flight.status;
    Object.assign(flight, input);
    const updated = await this.flightRepository.save(flight);

    // Publish subscription event when status changed
    if (input.status && input.status !== previousStatus) {
      const mapped = await this.mapper.mapAsync(
        updated,
        DBFlight,
        GraphQLFlight,
      );
      await pubSub.publish(FLIGHT_STATUS_UPDATED, {
        flightStatusUpdated: mapped,
      });
    }

    return this.mapper.mapAsync(updated, DBFlight, GraphQLFlight);
  }

  async deleteFlight(
    currentUserId: string,
    flightId: string,
  ): Promise<boolean> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    const flight = await this.flightRepository.findById(flightId);
    if (!flight) throw new NotFoundException('Flight not found');

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (!this.flightInvolvesAirport(flight, adminAirportId)) {
        throw new ForbiddenException(
          'You can only delete flights involving your airport.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    return this.flightRepository.delete(flightId);
  }

  async getFlight(
    currentUserId: string,
    flightId: string,
  ): Promise<GraphQLFlight> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    const flight = await this.flightRepository.findById(flightId);
    if (!flight) throw new NotFoundException('Flight not found');

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (!this.flightInvolvesAirport(flight, adminAirportId)) {
        throw new ForbiddenException(
          'You can only view flights involving your airport.',
        );
      }
    }

    return this.mapper.mapAsync(flight, DBFlight, GraphQLFlight);
  }

  async getFlights(
    currentUserId: string,
    query: FlightQueryInput,
  ): Promise<FlightResponse> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    let scopedAirportId: string | undefined = undefined;

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      scopedAirportId = await this.getAdminAirportId(currentUserId);
    }

    const { flights, page, totalCount } = await this.flightRepository.findMany(
      query,
      scopedAirportId,
    );

    const mapped = await this.mapper.mapArrayAsync(
      flights,
      DBFlight,
      GraphQLFlight,
    );

    return { flights: mapped, meta: { page, totalCount } };
  }

  async findFlightById(flightId: string): Promise<DBFlight | null> {
    return this.flightRepository.findById(flightId);
  }
}
