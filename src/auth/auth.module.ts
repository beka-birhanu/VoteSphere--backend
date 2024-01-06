import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refreshToken.strategy';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from './guards/role.guard';

@ApiTags('auth')
@Module({
  imports: [
    UsersModule, // Import the UsersModule for user management
    JwtModule.register({
      // Configure and register the JwtModule for JWT token handling
      global: true,
      secret: `${process.env.JWT_SECRET}`,
      signOptions: { expiresIn: '300s' },
    }),
  ],
  providers: [
    AuthService, // Authentication service
    LocalStrategy, // Local strategy for username/password authentication
    JwtStrategy, // JWT strategy for token validation
    RefreshJwtStrategy, // Strategy for refreshing JWT tokens
    RolesGuard, // Guard for role-based access control
  ],
  controllers: [AuthController], // Controller for authentication endpoints
  exports: [AuthService, RolesGuard], // Export AuthService and RolesGuard for use in other modules
})
export class AuthModule {}
