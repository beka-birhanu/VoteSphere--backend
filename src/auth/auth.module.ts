import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from './guards/role.guard';

@ApiTags('auth')
@Module({
  imports: [
    UsersModule, // Import the UsersModule for user management
    JwtModule.register({
      global: true,
      secret: `${process.env.JWT_SECRET}`,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService, // Authentication service
    LocalStrategy, // Local strategy for username/password authentication
    JwtStrategy, // JWT strategy for token validation
    RolesGuard, // Guard for role-based access control
  ],
  controllers: [AuthController], // Controller for authentication endpoints
  exports: [AuthService, RolesGuard], // Export AuthService and RolesGuard for use in other modules
})
export class AuthModule {}
