import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@ApiTags('auth')
@ApiBearerAuth()
@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract token and username from request
    const request = context.switchToHttp().getRequest();
    const header_token = this.extractTokenFromHeaders(request);
    const username = request.body.username;

    if (!header_token) {
      return false;
    }

    const decodedToken = this.authService.decodeToken(header_token);

    // If token verification fails
    // or the owner of the token dont match the requester
    // or the token is not a refresh token, access is denied
    if (!decodedToken || !decodedToken.username || decodedToken.username !== username || !decodedToken.role) {
      return false;
    }

    const blackList = await this.usersService.getBlacklistToken(username);

    // if the refresh token have been revoked access is denied
    if (blackList && blackList.includes(header_token)) {
      return false;
    }

    return true;
  }

  private extractTokenFromHeaders(request: Request): string | null {
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader && authorizationHeader.split(' ')[0] == 'Bearer') {
      return authorizationHeader.split(' ')[1];
    }
    return null;
  }
}
