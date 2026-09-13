import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// import { User } from '../users/user.entity';
// import { Booking } from '../bookings/booking.entity';
// import { Flight } from '../flights/flight.entity';

import { NotificationStatus } from '../graphql/types/notification.type';
import {
  NotificationChannel,
  NotificationType,
} from '../enums/notification.enums';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @Column({
    name: 'booking_id',
    type: 'uuid',
    nullable: true,
  })
  bookingId?: string;

  @Column({
    name: 'flight_id',
    type: 'uuid',
    nullable: true,
  })
  flightId?: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel!: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  subject?: string;

  @Column({
    type: 'text',
  })
  message!: string;

  @Column({
    name: 'is_read',
    type: 'boolean',
    default: false,
  })
  isRead!: boolean;

  @Column({
    name: 'read_at',
    type: 'timestamptz',
    nullable: true,
  })
  readAt?: Date;

  @Column({
    name: 'sent_at',
    type: 'timestamptz',
    nullable: true,
  })
  sentAt?: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;

  //   @ManyToOne(() => User, {
  //     onDelete: 'CASCADE',
  //   })
  //   @JoinColumn({ name: 'user_id' })
  //   user!: User;

  //   @ManyToOne(() => Booking, {
  //     nullable: true,
  //     onDelete: 'SET NULL',
  //   })
  //   @JoinColumn({ name: 'booking_id' })
  //   booking?: Booking;

  //   @ManyToOne(() => Flight, {
  //     nullable: true,
  //     onDelete: 'SET NULL',
  //   })
  //   @JoinColumn({ name: 'flight_id' })
  //   flight?: Flight;
}
