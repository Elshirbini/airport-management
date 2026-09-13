import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('airports')
export class Airport {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @AutoMap()
  @Column({
    type: 'varchar',
  })
  name!: string;

  @AutoMap()
  @Column({
    type: 'varchar',
    unique: true,
  })
  code!: string;

  @AutoMap()
  @Column({
    type: 'varchar',
  })
  city!: string;

  @AutoMap()
  @Column({
    type: 'varchar',
  })
  country!: string;

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
