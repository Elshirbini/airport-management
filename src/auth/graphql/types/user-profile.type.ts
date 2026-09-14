import { AutoMap } from '@automapper/classes';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserRole } from 'src/users/entities/user.entity';

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType()
export class UserProfile {
  @AutoMap()
  @Field(() => ID)
  id!: string;

  @AutoMap()
  @Field()
  email!: string;

  @AutoMap()
  @Field(() => UserRole)
  role!: UserRole;

  @AutoMap()
  @Field()
  emailVerified!: boolean;

  @AutoMap()
  @Field()
  createdAt!: Date;

  @AutoMap()
  @Field()
  updatedAt!: Date;
}
