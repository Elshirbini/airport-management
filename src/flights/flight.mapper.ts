import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';

import { Flight as GraphQLFlight } from './graphql/types/flight.type';
import { Flight as DBFlight } from './entities/flight.entity';

@Injectable()
export class FlightMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, DBFlight, GraphQLFlight);
    };
  }
}
