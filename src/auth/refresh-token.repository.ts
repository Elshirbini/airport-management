import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>,
  ) {}

  async findActiveTokensByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { userId, isRevoked: false },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository.update({ userId }, { isRevoked: true });
  }

  async save(
    token: RefreshToken | Partial<RefreshToken>,
  ): Promise<RefreshToken> {
    if (token instanceof RefreshToken) {
      return this.repository.save(token);
    }
    const newEntity = this.repository.create(token);
    return this.repository.save(newEntity);
  }
}
