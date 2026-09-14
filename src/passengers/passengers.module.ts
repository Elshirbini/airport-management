import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Passenger } from './entities/passenger.entity';
import { PassengerRepository } from './passenger.repository';
import { PassengerService } from './passenger.service';
import { PassengerResolver } from './passenger.resolver';
import { PassengerMapper } from './passenger.mapper';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Passenger]), UsersModule],
  providers: [
    PassengerRepository,
    PassengerService,
    PassengerResolver,
    PassengerMapper,
  ],
  exports: [PassengerRepository, PassengerService],
})
export class PassengersModule {}
