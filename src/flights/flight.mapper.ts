import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';

import { Flight as GraphQLFlight } from './graphql/types/flight.type';
import { Flight as DBFlight } from './entities/flight.entity';

const toDate = (v: unknown): Date =>
  v instanceof Date ? v : new Date(v as string);

@Injectable()
export class FlightMapper extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        DBFlight,
        GraphQLFlight,
        forMember(
          (d) => d.departureTime,
          mapFrom((s) => toDate(s.departureTime)),
        ),
        forMember(
          (d) => d.arrivalTime,
          mapFrom((s) => toDate(s.arrivalTime)),
        ),
        forMember(
          (d) => d.createdAt,
          mapFrom((s) => toDate(s.createdAt)),
        ),
        forMember(
          (d) => d.updatedAt,
          mapFrom((s) => toDate(s.updatedAt)),
        ),
      );

      // Self-map: re-hydrates a plain GraphQLFlight from Redis (string dates → Date)
      createMap(
        mapper,
        GraphQLFlight,
        GraphQLFlight,
        forMember(
          (d) => d.departureTime,
          mapFrom((s) => toDate(s.departureTime)),
        ),
        forMember(
          (d) => d.arrivalTime,
          mapFrom((s) => toDate(s.arrivalTime)),
        ),
        forMember(
          (d) => d.createdAt,
          mapFrom((s) => toDate(s.createdAt)),
        ),
        forMember(
          (d) => d.updatedAt,
          mapFrom((s) => toDate(s.updatedAt)),
        ),
      );
    };
  }
}
