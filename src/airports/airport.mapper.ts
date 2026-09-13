import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';

import { Airport as GraphQLAirport } from './graphql/types/airport.type';
import { Airport as DBAirport } from './entities/airport.entity';

@Injectable()
export class AirportMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, DBAirport, GraphQLAirport);
    };
  }
}
