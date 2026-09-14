import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';

import { Staff as GraphQLStaff } from './graphql/types/staff.type';
import { Staff as DBStaff } from './entities/staff.entity';

@Injectable()
export class StaffMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, DBStaff, GraphQLStaff);
    };
  }
}
