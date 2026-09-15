import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { SuperAdminSeedService } from './super-admin.seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersRepository, SuperAdminSeedService],
  exports: [UsersRepository],
})
export class UsersModule {}
