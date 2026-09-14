import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { resolvePagination } from '../common/utils/pagination.util';
import { Staff } from './entities/staff.entity';
import { StaffQueryInput } from './graphql/inputs/staff-query.input';

@Injectable()
export class StaffRepository {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async createStaff(staffData: Partial<Staff>): Promise<Staff> {
    const staff = this.staffRepository.create(staffData);
    return this.staffRepository.save(staff);
  }

  async getStaffs(
    query: StaffQueryInput,
    airportId?: string,
  ): Promise<{
    staffs: Staff[];
    page: number;
    totalCount: number;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where = airportId ? { airportId } : {};
    const [staffs, totalCount] = await this.staffRepository.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      staffs,
      page,
      totalCount,
    };
  }

  async findStaffById(id: string): Promise<Staff | null> {
    return this.staffRepository.findOne({
      where: { id },
    });
  }

  async findStaffByUserId(userId: string): Promise<Staff | null> {
    return this.staffRepository.findOne({
      where: { userId },
    });
  }

  async saveStaff(staff: Staff): Promise<Staff> {
    return this.staffRepository.save(staff);
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await this.staffRepository.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }
}
