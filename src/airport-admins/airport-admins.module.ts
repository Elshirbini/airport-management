import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AirportAdmin } from './entities/airport-admin.entity';
import { AirportAdminRepository } from './airport-admin.repository';
import { AirportAdminService } from './airport-admin.service';
import { AirportAdminResolver } from './airport-admin.resolver';
import { AirportAdminMapper } from './airport-admin.mapper';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([AirportAdmin]), UsersModule],
  providers: [
    AirportAdminRepository,
    AirportAdminService,
    AirportAdminResolver,
    AirportAdminMapper,
  ],
  exports: [AirportAdminService, AirportAdminRepository],
})
export class AirportAdminsModule {}
