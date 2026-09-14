import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Passenger } from '../../passengers/entities/passenger.entity';
import { Flight } from '../../flights/entities/flight.entity';

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
}

@Entity('bookings')
export class Booking {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @AutoMap()
  @Column({ name: 'passenger_id', type: 'uuid' })
  passengerId!: string;

  @ManyToOne(() => Passenger)
  @JoinColumn({ name: 'passenger_id' })
  passenger?: Passenger;

  @AutoMap()
  @Column({ name: 'flight_id', type: 'uuid' })
  flightId!: string;

  @ManyToOne(() => Flight)
  @JoinColumn({ name: 'flight_id' })
  flight?: Flight;

  @AutoMap()
  @Column({ name: 'seat_number', type: 'int' })
  seatNumber!: number;

  @AutoMap()
  @Column({
    type: 'enum',
    enum: BookingStatus,
  })
  status!: BookingStatus;

  @AutoMap()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @AutoMap()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
