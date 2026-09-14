import { AutoMap } from '@automapper/classes';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { StaffRole } from '../../entities/staff.entity';

registerEnumType(StaffRole, {
  name: 'StaffRole',
});

@ObjectType()
export class Staff {
  @AutoMap()
  @Field(() => ID)
  id!: string;

  @AutoMap()
  @Field(() => ID)
  userId!: string;

  @AutoMap()
  @Field(() => ID)
  airportId!: string;

  @AutoMap()
  @Field(() => StaffRole)
  role!: StaffRole;

  @AutoMap()
  @Field(() => ID, { nullable: true })
  assignedFlightId?: string;

  @AutoMap()
  @Field()
  createdAt!: Date;

  @AutoMap()
  @Field()
  updatedAt!: Date;
}
