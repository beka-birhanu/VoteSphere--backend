import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@ApiBearerAuth()
@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.JWT_SECRET}`,
    });
  }

  /**
   * Validate the JWT payload for refreshing the token.
   * @param payload - JWT payload
   * @returns {boolean} - True if the payload is valid
   * @throws UnauthorizedException if the payload is invalid
   */
  async validate(payload: any) {
    // Ensure the payload is present and contains required fields
    if (!payload || !payload.email || !payload.username) {
      throw new UnauthorizedException();
    }

    // Return true if the payload is valid
    return true;
  }
}
