import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'username', passwordField: 'password' });
  }

  /**
   * Validate user credentials for local authentication.
   * @param username - User's username
   * @param password - User's password
   * @returns {boolean} - True if the credentials are valid
   * @throws UnauthorizedException if the credentials are invalid
   */
  async validate(username: string, password: string) {
    // Validate user credentials using the AuthService
    const isValid = await this.authService.validatePassword(username, password);

    // Throw UnauthorizedException for invalid credentials
    if (isValid === 1) {
      throw new UnauthorizedException('Invalid username');
    } else if (isValid === 2) {
      throw new UnauthorizedException('Invalid password');
    } else if (isValid === 3) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return true if the credentials are valid
    return true;
  }
}
