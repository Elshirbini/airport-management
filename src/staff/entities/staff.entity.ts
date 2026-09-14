import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Airport } from '../../airports/entities/airport.entity';

export enum StaffRole {
  PILOT = 'PILOT',
  CREW = 'CREW',
  GROUND_STAFF = 'GROUND_STAFF',
  SECURITY = 'SECURITY',
}

@Entity('staff')
export class Staff {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @AutoMap()
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @AutoMap()
  @Column({ name: 'airport_id', type: 'uuid' })
  airportId!: string;

  @ManyToOne(() => Airport)
  @JoinColumn({ name: 'airport_id' })
  airport?: Airport;

  @AutoMap()
  @Column({
    type: 'enum',
    enum: StaffRole,
  })
  role!: StaffRole;

  @AutoMap()
  @Column({ name: 'assigned_flight_id', type: 'uuid', nullable: true })
  assignedFlightId?: string;

  @AutoMap()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @AutoMap()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
