import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@ApiBearerAuth()
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.JWT_SECRET}`,
    });
  }

  /**
   * Validate the JWT payload.
   * @param payload - JWT payload
   * @returns User information extracted from the JWT
   * @throws UnauthorizedException if the payload is invalid
   */
  async validate(payload: any) {
    // Ensure the payload is present and contains required fields
    if (!payload || !payload.email || !payload.username) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
