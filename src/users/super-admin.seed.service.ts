import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from './entities/user.entity';
import { UsersRepository } from './users.repository';

const DEFAULT_SUPER_ADMIN_EMAIL = 'admin@airport.local';
const DEFAULT_SUPER_ADMIN_PASSWORD = 'Admin123!';

@Injectable()
export class SuperAdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminSeedService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'prod';
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

    if (isProduction && (!email || !password)) {
      throw new Error(
        'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in production.',
      );
    }

    const superAdminEmail = (email ?? DEFAULT_SUPER_ADMIN_EMAIL).toLowerCase();
    const superAdminPassword = password ?? DEFAULT_SUPER_ADMIN_PASSWORD;
    const existingUser =
      await this.usersRepository.findByEmail(superAdminEmail);

    if (existingUser) {
      return;
    }

    await this.usersRepository.create({
      email: superAdminEmail,
      password: await bcrypt.hash(superAdminPassword, 12),
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
    });

    this.logger.log(`Created super admin account: ${superAdminEmail}`);
  }
}
