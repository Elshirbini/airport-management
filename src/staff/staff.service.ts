import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

import { StaffRepository } from './staff.repository';
import { UsersRepository } from '../users/users.repository';
import { AirportAdminRepository } from '../airport-admins/airport-admin.repository';
import { FlightService } from '../flights/flight.service';
import { Staff as DBStaff } from './entities/staff.entity';
import { Staff as GraphQLStaff } from './graphql/types/staff.type';
import { StaffResponse } from './graphql/types/staff-response.type';
import { UserRole, User } from '../users/entities/user.entity';
import { CreateStaffInput } from './graphql/inputs/create-staff.input';
import { UpdateStaffInput } from './graphql/inputs/update-staff.input';
import { StaffQueryInput } from './graphql/inputs/staff-query.input';

@Injectable()
export class StaffService {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly usersRepository: UsersRepository,
    private readonly airportAdminRepository: AirportAdminRepository,
    private readonly flightService: FlightService,
    private readonly dataSource: DataSource,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  /**
   * Resolves the airport that the authenticated AIRPORT_ADMIN belongs to.
   * Uses AirportAdminRepository — NOT StaffRepository.
   */
  private async getAdminAirportId(userId: string): Promise<string> {
    const adminRecord = await this.airportAdminRepository.findByUserId(userId);
    if (!adminRecord) {
      throw new ForbiddenException(
        'AIRPORT_ADMIN user must have an associated AirportAdmin record to determine their airport.',
      );
    }
    return adminRecord.airportId;
  }

  async createStaff(
    currentUserId: string,
    input: CreateStaffInput,
  ): Promise<GraphQLStaff> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException('User not found');

    let resolvedAirportId: string;

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      resolvedAirportId = await this.getAdminAirportId(currentUserId);
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!input.airportId) {
        throw new BadRequestException('airportId is required for SUPER_ADMIN');
      }
      resolvedAirportId = input.airportId;
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
        role: UserRole.STAFF,
        emailVerified: true,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      const staff = queryRunner.manager.create(DBStaff, {
        userId: savedUser.id,
        airportId: resolvedAirportId,
        role: input.role,
      });

      const savedStaff = await queryRunner.manager.save(DBStaff, staff);

      await queryRunner.commitTransaction();

      return this.mapper.mapAsync(savedStaff, DBStaff, GraphQLStaff);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStaff(
    currentUserId: string,
    staffId: string,
    input: UpdateStaffInput,
  ): Promise<GraphQLStaff> {
    const staff = await this.staffRepository.findStaffById(staffId);
    if (!staff) throw new NotFoundException('Staff not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (adminAirportId !== staff.airportId) {
        throw new ForbiddenException(
          'You can only update staff from your own airport.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    if (input.role) {
      staff.role = input.role;
    }

    const updated = await this.staffRepository.saveStaff(staff);
    return this.mapper.mapAsync(updated, DBStaff, GraphQLStaff);
  }

  async deleteStaff(currentUserId: string, staffId: string): Promise<boolean> {
    const staff = await this.staffRepository.findStaffById(staffId);
    if (!staff) throw new NotFoundException('Staff not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (adminAirportId !== staff.airportId) {
        throw new ForbiddenException(
          'You can only delete staff from your own airport.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(DBStaff, { id: staffId });
      await queryRunner.manager.delete(User, { id: staff.userId });
      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getStaff(
    currentUserId: string,
    staffId: string,
  ): Promise<GraphQLStaff> {
    const staff = await this.staffRepository.findStaffById(staffId);
    if (!staff) throw new NotFoundException('Staff not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (adminAirportId !== staff.airportId) {
        throw new ForbiddenException(
          'You can only view staff from your own airport.',
        );
      }
    } else if (currentUser.role === UserRole.STAFF) {
      const userStaff =
        await this.staffRepository.findStaffByUserId(currentUserId);
      if (!userStaff || userStaff.id !== staffId) {
        throw new ForbiddenException(
          'You can only view your own staff record.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    return this.mapper.mapAsync(staff, DBStaff, GraphQLStaff);
  }

  async getStaffs(
    currentUserId: string,
    query: StaffQueryInput,
  ): Promise<StaffResponse> {
    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    let airportIdFilter: string | undefined = undefined;

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      airportIdFilter = await this.getAdminAirportId(currentUserId);
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to list staff directory.',
      );
    }

    const { staffs, page, totalCount } = await this.staffRepository.getStaffs(
      query,
      airportIdFilter,
    );

    const mappedStaffs = await this.mapper.mapArrayAsync(
      staffs,
      DBStaff,
      GraphQLStaff,
    );

    return {
      staffs: mappedStaffs,
      meta: { page, totalCount },
    };
  }

  async assignStaffToFlight(
    currentUserId: string,
    staffId: string,
    flightId: string,
  ): Promise<GraphQLStaff> {
    const staff = await this.staffRepository.findStaffById(staffId);
    if (!staff) throw new NotFoundException('Staff not found');

    const currentUser = await this.usersRepository.findById(currentUserId);
    if (!currentUser) throw new UnauthorizedException();

    if (currentUser.role === UserRole.AIRPORT_ADMIN) {
      const adminAirportId = await this.getAdminAirportId(currentUserId);
      if (adminAirportId !== staff.airportId) {
        throw new ForbiddenException(
          'Cannot manage staff outside your airport',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    const flight = await this.flightService.findFlightById(flightId);
    if (!flight) throw new NotFoundException('Flight not found');

    const flightInvolvesStaffAirport =
      flight.departureAirportId === staff.airportId ||
      flight.destinationAirportId === staff.airportId;

    if (!flightInvolvesStaffAirport) {
      throw new ForbiddenException(
        'Staff can only be assigned to flights involving their own airport.',
      );
    }

    staff.assignedFlightId = flightId;
    const updated = await this.staffRepository.saveStaff(staff);
    return this.mapper.mapAsync(updated, DBStaff, GraphQLStaff);
  }
}
