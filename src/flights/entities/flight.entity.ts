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
import { Airport } from '../../airports/entities/airport.entity';

export enum FlightStatus {
  ON_TIME = 'ON_TIME',
  DELAYED = 'DELAYED',
  CANCELED = 'CANCELED',
}

@Entity('flights')
export class Flight {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @AutoMap()
  @Column({ name: 'flight_number', type: 'varchar', unique: true })
  flightNumber!: string;

  @AutoMap()
  @Column({ name: 'departure_airport_id', type: 'uuid' })
  departureAirportId!: string;

  @ManyToOne(() => Airport)
  @JoinColumn({ name: 'departure_airport_id' })
  departureAirport?: Airport;

  @AutoMap()
  @Column({ name: 'destination_airport_id', type: 'uuid' })
  destinationAirportId!: string;

  @ManyToOne(() => Airport)
  @JoinColumn({ name: 'destination_airport_id' })
  destinationAirport?: Airport;

  @AutoMap()
  @Column({ name: 'departure_time', type: 'timestamptz' })
  departureTime!: Date;

  @AutoMap()
  @Column({ name: 'arrival_time', type: 'timestamptz' })
  arrivalTime!: Date;

  @AutoMap()
  @Column({ type: 'varchar' })
  airline!: string;

  @AutoMap()
  @Column({ name: 'available_seats', type: 'int' })
  availableSeats!: number;

  @AutoMap()
  @Column({
    type: 'enum',
    enum: FlightStatus,
    default: FlightStatus.ON_TIME,
  })
  status!: FlightStatus;

  @AutoMap()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @AutoMap()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
