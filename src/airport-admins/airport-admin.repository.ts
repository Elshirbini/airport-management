import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AirportAdmin } from './entities/airport-admin.entity';
import { AirportAdminQueryInput } from './graphql/inputs/airport-admin-query.input';

@Injectable()
export class AirportAdminRepository {
  constructor(
    @InjectRepository(AirportAdmin)
    private readonly repository: Repository<AirportAdmin>,
  ) {}

  async create(data: Partial<AirportAdmin>): Promise<AirportAdmin> {
    const record = this.repository.create(data);
    return this.repository.save(record);
  }

  async findById(id: string): Promise<AirportAdmin | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<AirportAdmin | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async findMany(
    query: AirportAdminQueryInput,
    airportId?: string,
  ): Promise<{ airportAdmins: AirportAdmin[]; totalCount: number }> {
    const where = airportId ? { airportId } : {};
    const [airportAdmins, totalCount] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: query.limit ?? 10,
    });
    return { airportAdmins, totalCount };
  }

  async save(record: AirportAdmin): Promise<AirportAdmin> {
    return this.repository.save(record);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }
}
