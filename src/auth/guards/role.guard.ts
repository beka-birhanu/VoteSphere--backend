import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Injectable()
@ApiBearerAuth()
@ApiTags('auth')
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private userService: UsersService,
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

    // If no token is found, access is denied
    if (!token) {
      return false;
    }

    // Decode the token to extract username
    const decodedToken = this.decodeToken(token);

    // If token verification fails, access is denied
    if (!decodedToken) {
      return false;
    }

    // Extract the username from the decoded token
    const username = decodedToken.username;

    // Use userservice to get the actual user roles
    const userRoles = await this.userService.getUserRole(username);

    // Check if user roles match the required roles
    return this.matchRoles(rolesRequired, userRoles);
  }

  // Extract token from headers
  private extractTokenFromHeaders(request: any): string | null {
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader && authorizationHeader.split(' ')[0] == 'Bearer') {
      return authorizationHeader.split(' ')[1];
    }
    return null;
  }

  // Decode the token using the JWT service
  private decodeToken(token: string): { username: string } | null {
    try {
      return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    } catch (error) {
      return null;
    }
  }

  // Check if user roles match the required roles
  private matchRoles(rolesRequired: string[], role: string): boolean {
    return rolesRequired.includes(role);
  }
}
