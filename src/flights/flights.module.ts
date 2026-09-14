import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Flight } from './entities/flight.entity';
import { FlightRepository } from './flight.repository';
import { FlightService } from './flight.service';
import { FlightResolver } from './flight.resolver';
import { FlightMapper } from './flight.mapper';

import { AirportModule } from '../airports/airport.module';
import { AirportAdminsModule } from '../airport-admins/airport-admins.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flight]),
    AirportModule,
    AirportAdminsModule,
    UsersModule,
  ],
  providers: [FlightRepository, FlightService, FlightResolver, FlightMapper],
  exports: [FlightService, FlightRepository],
})
export class FlightsModule {}
