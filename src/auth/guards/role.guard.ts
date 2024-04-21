import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
@ApiBearerAuth()
@ApiTags('auth')
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the roles assigned to the route handler
    const rolesRequired = this.reflector.get(Roles, context.getHandler());

    // If no roles are specified, access is granted
    if (!rolesRequired) {
      return true;
    }

    // Extract token from request headers
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeaders(request);

    if (!token) {
      return false;
    }

    const decodedToken = this.authService.decodeToken(token);

    // If token verification fails, access is denied
    if (!decodedToken) {
      return false;
    }

    const username = decodedToken.username;
    const userRoles = await this.userService.getUserRole(username);

    // Check if user roles match the required roles
    return this.matchRoles(rolesRequired, userRoles);
  }

  private extractTokenFromHeaders(request: Request): string | null {
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader && authorizationHeader.split(' ')[0] == 'Bearer') {
      return authorizationHeader.split(' ')[1];
    }
    return null;
  }

  private matchRoles(rolesRequired: string[], role: string): boolean {
    return rolesRequired.includes(role);
  }
}
