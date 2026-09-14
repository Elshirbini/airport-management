import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

import { PassengerRepository } from './passenger.repository';
import { UsersRepository } from '../users/users.repository';
import { Passenger as DBPassenger } from './entities/passenger.entity';
import { Passenger as GraphQLPassenger } from './graphql/types/passenger.type';
import { PassengerResponse } from './graphql/types/passenger-response.type';
import { User, UserRole } from '../users/entities/user.entity';
import { UpdatePassengerInput } from './graphql/inputs/update-passenger.input';
import { UpdateMyPassengerProfileInput } from './graphql/inputs/update-my-passenger-profile.input';
import { PassengerQueryInput } from './graphql/inputs/passenger-query.input';

@Injectable()
export class PassengerService {
  constructor(
    private readonly passengerRepository: PassengerRepository,
    private readonly usersRepository: UsersRepository,
    private readonly dataSource: DataSource,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async getPassengers(
    currentUserId: string,
    query: PassengerQueryInput,
  ): Promise<PassengerResponse> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to list passengers.',
      );
    }

    const { passengers, page, totalCount } =
      await this.passengerRepository.getPassengers(query);

    const mappedPassengers = await this.mapper.mapArrayAsync(
      passengers,
      DBPassenger,
      GraphQLPassenger,
    );

    return {
      passengers: mappedPassengers,
      meta: { page, totalCount },
    };
  }

  async getPassenger(
    currentUserId: string,
    passengerId: string,
  ): Promise<GraphQLPassenger> {
    const passenger =
      await this.passengerRepository.findPassengerById(passengerId);
    if (!passenger) throw new NotFoundException('Passenger not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role === UserRole.PASSENGER) {
      const userPassenger =
        await this.passengerRepository.findPassengerByUserId(currentUserId);
      if (!userPassenger || userPassenger.id !== passengerId) {
        throw new ForbiddenException(
          'You can only view your own passenger profile.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    return this.mapper.mapAsync(passenger, DBPassenger, GraphQLPassenger);
  }

  async updatePassenger(
    currentUserId: string,
    passengerId: string,
    input: UpdatePassengerInput,
  ): Promise<GraphQLPassenger> {
    const passenger =
      await this.passengerRepository.findPassengerById(passengerId);
    if (!passenger) throw new NotFoundException('Passenger not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    await this.applyPassengerUpdates(passenger, input);

    const updated = await this.passengerRepository.savePassenger(passenger);
    return this.mapper.mapAsync(updated, DBPassenger, GraphQLPassenger);
  }

  async updateMyPassengerProfile(
    currentUserId: string,
    input: UpdateMyPassengerProfileInput,
  ): Promise<GraphQLPassenger> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role !== UserRole.PASSENGER) {
      throw new ForbiddenException(
        'Only passengers can update their own profile.',
      );
    }

    const passenger =
      await this.passengerRepository.findPassengerByUserId(currentUserId);
    if (!passenger) {
      throw new NotFoundException('Passenger profile not found');
    }

    await this.applyPassengerUpdates(passenger, input);

    const updated = await this.passengerRepository.savePassenger(passenger);
    return this.mapper.mapAsync(updated, DBPassenger, GraphQLPassenger);
  }

  async deletePassenger(
    currentUserId: string,
    passengerId: string,
  ): Promise<boolean> {
    const passenger =
      await this.passengerRepository.findPassengerById(passengerId);
    if (!passenger) throw new NotFoundException('Passenger not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    await this.dataSource.manager.transaction(async (manager) => {
      await manager.delete(DBPassenger, { id: passengerId });
      await manager.delete(User, { id: passenger.userId });
    });

    return true;
  }

  private async applyPassengerUpdates(
    passenger: DBPassenger,
    input: UpdatePassengerInput | UpdateMyPassengerProfileInput,
  ): Promise<void> {
    if (
      input.passportNumber &&
      input.passportNumber !== passenger.passportNumber
    ) {
      const existing =
        await this.passengerRepository.findPassengerByPassportNumber(
          input.passportNumber,
        );
      if (existing && existing.id !== passenger.id) {
        throw new ConflictException(
          'A passenger with this passport number already exists',
        );
      }
      passenger.passportNumber = input.passportNumber;
    }

    if (input.name) {
      passenger.name = input.name;
    }

    if (input.nationality) {
      passenger.nationality = input.nationality;
    }
  }
}
