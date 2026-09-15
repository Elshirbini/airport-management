import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { FlightRepository } from '../../flights/flight.repository';
import { Flight } from '../../flights/entities/flight.entity';

@Injectable({ scope: Scope.REQUEST })
export class FlightLoader {
  private readonly loader: DataLoader<string, Flight | null>;

  constructor(private readonly flightRepository: FlightRepository) {
    this.loader = new DataLoader<string, Flight | null>(async (keys) => {
      const flights = await this.flightRepository.findByIds(keys as string[]);
      const flightMap = new Map<string, Flight>();
      flights.forEach((flight) => {
        flightMap.set(flight.id, flight);
      });
      return keys.map((key) => flightMap.get(key) || null);
    });
  }

  load(id: string): Promise<Flight | null> {
    return this.loader.load(id);
  }

  loadMany(ids: string[]): Promise<Array<Flight | Error | null>> {
    return this.loader.loadMany(ids);
  }
}
