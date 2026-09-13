import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  AIRPORT_ADMIN = 'AIRPORT_ADMIN',
  STAFF = 'STAFF',
  PASSENGER = 'PASSENGER',
}

@Entity('users')
export class User {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @AutoMap()
  @Column({
    type: 'varchar',
    unique: true,
  })
  email!: string;

  @Column({
    name: 'password',
    type: 'varchar',
  })
  password!: string;

  @AutoMap()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PASSENGER,
  })
  role!: UserRole;

  @AutoMap()
  @Column({
    name: 'email_verified',
    type: 'boolean',
    default: false,
  })
  emailVerified!: boolean;

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
