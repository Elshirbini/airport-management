import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';

import { Passenger as GraphQLPassenger } from './graphql/types/passenger.type';
import { Passenger as DBPassenger } from './entities/passenger.entity';

@Injectable()
export class PassengerMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, DBPassenger, GraphQLPassenger);
    };
  }
}
