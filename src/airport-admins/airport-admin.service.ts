import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

import { AirportAdminRepository } from './airport-admin.repository';
import { UsersRepository } from '../users/users.repository';
import { AirportAdmin as DBAirportAdmin } from './entities/airport-admin.entity';
import { AirportAdmin as GraphQLAirportAdmin } from './graphql/types/airport-admin.type';
import { AirportAdminResponse } from './graphql/types/airport-admin-response.type';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateAirportAdminInput } from './graphql/inputs/create-airport-admin.input';
import { AirportAdminQueryInput } from './graphql/inputs/airport-admin-query.input';

@Injectable()
export class AirportAdminService {
  constructor(
    private readonly airportAdminRepository: AirportAdminRepository,
    private readonly usersRepository: UsersRepository,
    private readonly dataSource: DataSource,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  /**
   * Resolves the airport that the authenticated AIRPORT_ADMIN belongs to.
   * Queries AirportAdminRepository — NOT StaffRepository.
   */
  async getAdminAirportId(userId: string): Promise<string> {
    const adminRecord = await this.airportAdminRepository.findByUserId(userId);
    if (!adminRecord) {
      throw new ForbiddenException(
        'AIRPORT_ADMIN user must have an associated AirportAdmin record.',
      );
    }
    return adminRecord.airportId;
  }

  async createAirportAdmin(
    currentUserId: string,
    input: CreateAirportAdminInput,
  ): Promise<GraphQLAirportAdmin> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException('User not found');

    let resolvedAirportId: string;

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!input.airportId) {
        throw new BadRequestException(
          'airportId is required when creating an Airport Admin as SUPER_ADMIN',
        );
      }
      resolvedAirportId = input.airportId;
    } else if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      // Airport Admin can only create within their own airport
      resolvedAirportId = await this.getAdminAirportId(currentUserId);
    } else {
      throw new ForbiddenException();
    }

    const existingUser = await this.usersRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = queryRunner.manager.create(User, {
        email: input.email.toLowerCase(),
        password: passwordHash,
        role: UserRole.AIRPORT_ADMIN,
        emailVerified: true,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      const adminRecord = queryRunner.manager.create(DBAirportAdmin, {
        userId: savedUser.id,
        airportId: resolvedAirportId,
      });

      const savedAdmin = await queryRunner.manager.save(
        DBAirportAdmin,
        adminRecord,
      );

      await queryRunner.commitTransaction();

      return this.mapper.mapAsync(
        savedAdmin,
        DBAirportAdmin,
        GraphQLAirportAdmin,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getAirportAdmin(
    currentUserId: string,
    id: string,
  ): Promise<GraphQLAirportAdmin> {
    const target = await this.airportAdminRepository.findById(id);
    if (!target) throw new NotFoundException('Airport Admin not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const currentAirportId = await this.getAdminAirportId(currentUserId);
      if (currentAirportId !== target.airportId) {
        throw new ForbiddenException(
          'You can only view Airport Admins from your own airport.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    return this.mapper.mapAsync(target, DBAirportAdmin, GraphQLAirportAdmin);
  }

  async getAirportAdmins(
    currentUserId: string,
    query: AirportAdminQueryInput,
  ): Promise<AirportAdminResponse> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    let airportIdFilter: string | undefined = undefined;

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      airportIdFilter = await this.getAdminAirportId(currentUserId);
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to list Airport Admins.',
      );
    }

    const { airportAdmins, totalCount } =
      await this.airportAdminRepository.findMany(query, airportIdFilter);

    const mapped = await this.mapper.mapArrayAsync(
      airportAdmins,
      DBAirportAdmin,
      GraphQLAirportAdmin,
    );

    return { airportAdmins: mapped, meta: { totalCount } };
  }

  async deleteAirportAdmin(
    currentUserId: string,
    id: string,
  ): Promise<boolean> {
    const target = await this.airportAdminRepository.findById(id);
    if (!target) throw new NotFoundException('Airport Admin not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const currentAirportId = await this.getAdminAirportId(currentUserId);
      if (currentAirportId !== target.airportId) {
        throw new ForbiddenException(
          'You can only delete Airport Admins from your own airport.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(DBAirportAdmin, { id });
      await queryRunner.manager.delete(User, { id: target.userId });
      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
