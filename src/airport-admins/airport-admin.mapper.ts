import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';

import { AirportAdmin as GraphQLAirportAdmin } from './graphql/types/airport-admin.type';
import { AirportAdmin as DBAirportAdmin } from './entities/airport-admin.entity';

@Injectable()
export class AirportAdminMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, DBAirportAdmin, GraphQLAirportAdmin);
    };
  }
}
