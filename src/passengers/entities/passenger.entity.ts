import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('passengers')
export class Passenger {
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
  @Column({ type: 'varchar' })
  name!: string;

  @AutoMap()
  @Column({ name: 'passport_number', type: 'varchar', unique: true })
  passportNumber!: string;

  @AutoMap()
  @Column({ type: 'varchar' })
  nationality!: string;

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
