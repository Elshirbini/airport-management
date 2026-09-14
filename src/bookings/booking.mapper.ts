import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';

import { Booking as GraphQLBooking } from './graphql/types/booking.type';
import { Booking as DBBooking } from './entities/booking.entity';

@Injectable()
export class BookingMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, DBBooking, GraphQLBooking);
    };
  }
}
