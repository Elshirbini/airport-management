import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';

import { Notification as GraphQLNotification } from '../graphql/types/notification.type';
import { Notification as DBNotification } from '../entities/notification.entity';

@Injectable()
export class NotificationMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, DBNotification, GraphQLNotification);
    };
  }
}
