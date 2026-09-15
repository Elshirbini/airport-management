import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PassengerRepository } from '../../passengers/passenger.repository';
import { Passenger } from '../../passengers/entities/passenger.entity';

@Injectable({ scope: Scope.REQUEST })
export class PassengerLoader {
  private readonly loader: DataLoader<string, Passenger | null>;

  constructor(private readonly passengerRepository: PassengerRepository) {
    this.loader = new DataLoader<string, Passenger | null>(async (keys) => {
      const passengers = await this.passengerRepository.findByIds(
        keys as string[],
      );
      const passengerMap = new Map<string, Passenger>();
      passengers.forEach((passenger) => {
        passengerMap.set(passenger.id, passenger);
      });
      return keys.map((key) => passengerMap.get(key) || null);
    });
  }

  load(id: string): Promise<Passenger | null> {
    return this.loader.load(id);
  }

  loadMany(ids: string[]): Promise<Array<Passenger | Error | null>> {
    return this.loader.loadMany(ids);
  }
}
