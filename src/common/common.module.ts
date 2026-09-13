import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard],
})
export class CommonModule {}
