import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Airport } from './entities/airport.entity';
import { AirportResolver } from './airport.resolver';
import { AirportService } from './airport.service';
import { AirportRepository } from './airport.repository';
import { AirportMapper } from './airport.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([Airport])],
  providers: [
    AirportResolver,
    AirportService,
    AirportRepository,
    AirportMapper,
  ],
  exports: [AirportService, AirportRepository],
})
export class AirportModule {}
