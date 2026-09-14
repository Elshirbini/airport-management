import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { StaffService } from './staff.service';
import { Staff } from './graphql/types/staff.type';
import { StaffResponse } from './graphql/types/staff-response.type';
import { CreateStaffInput } from './graphql/inputs/create-staff.input';
import { UpdateStaffInput } from './graphql/inputs/update-staff.input';
import { StaffQueryInput } from './graphql/inputs/staff-query.input';

@Resolver(() => Staff)
export class StaffResolver {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Query(() => StaffResponse)
  staffs(
    @CurrentUser() userId: string,
    @Args('input', { nullable: true, defaultValue: {} })
    input: StaffQueryInput,
  ) {
    return this.staffService.getStaffs(userId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Staff)
  staff(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.staffService.getStaff(userId, id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Staff)
  createStaff(
    @CurrentUser() userId: string,
    @Args('input') input: CreateStaffInput,
  ) {
    return this.staffService.createStaff(userId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Staff)
  updateStaff(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateStaffInput,
  ) {
    return this.staffService.updateStaff(userId, id, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Boolean)
  deleteStaff(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.staffService.deleteStaff(userId, id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'AIRPORT_ADMIN')
  @Mutation(() => Staff)
  assignStaffToFlight(
    @CurrentUser() userId: string,
    @Args('staffId', { type: () => ID }) staffId: string,
    @Args('flightId', { type: () => ID }) flightId: string,
  ) {
    return this.staffService.assignStaffToFlight(userId, staffId, flightId);
  }
}
