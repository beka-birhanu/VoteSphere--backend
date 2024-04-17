import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';

@ApiTags('auth')
@ApiBearerAuth()
@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract token and username from request
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeaders(request);
    const username = request.body.username;

    // If no token is found, access is denied
    if (!token) {
      return false;
    }
    // Decode the token to extract username
    const decodedToken = this.decodeToken(token);

    // If token verification fails
    // or the owner of the token dont match the requester
    // or the token is not a refresh token, access is denied
    if (
      !decodedToken ||
      !decodedToken.username ||
      decodedToken.username !== username ||
      !decodedToken.role
    ) {
      return false;
    }

    const blackList = await this.usersService.getBlacklist(username);

    // if the refresh token have been revoked access is denied
    if (blackList && blackList.includes(token)) {
      return false;
    }

    return true;
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
  private decodeToken(
    token: string,
  ): { username: string; role: string } | null {
    try {
      return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    } catch (error) {
      return null;
    }
  }
}
