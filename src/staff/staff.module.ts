import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Staff } from './entities/staff.entity';
import { StaffRepository } from './staff.repository';
import { StaffService } from './staff.service';
import { StaffResolver } from './staff.resolver';
import { StaffMapper } from './staff.mapper';
import { UsersModule } from '../users/users.module';
import { AirportAdminsModule } from '../airport-admins/airport-admins.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff]),
    UsersModule,
    AirportAdminsModule,
  ],
  providers: [StaffRepository, StaffService, StaffResolver, StaffMapper],
  exports: [StaffService],
})
export class StaffModule {}
