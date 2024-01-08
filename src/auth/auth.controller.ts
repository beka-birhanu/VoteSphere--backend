import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInUserDto } from './dtos/signInUserDto.dto';
import { LocalAuthGuard } from './guards/localAuth.guard';
import { RefreshJwtGuard } from './guards/refreshJwtToken.guard';
import { CreateUserDto } from 'src/users/dtos/createUserDto.dto';
import { RefreshTokenDto } from './dtos/refreshTokenDto.dto';
import { SignOutUserDto } from './dtos/signoutUserDto.dto';
import { JwtGuard } from './guards/jwtAuth.guard';
import { STATUS_CODES } from 'http';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  /**
   * Sign up a new user.
   * @param signUpUserDto - User's sign-up information
   * @returns {Object} - Object containing username, access_token, and refresh_token
   * @throws {ConflictException} if a user with the same username or email already exists
   * @throws {BadRequestException} if the password is not strong enough
   */
  @Post('signup')
  async signUpUser(@Body() signUpUserDto: CreateUserDto) {
    return this.authService.signUp(signUpUserDto);
  }

  /**
   * Sign in a user.
   * @param signInDto - User's sign-in information
   * @returns {Object} - Object containing username, access_token, and refresh_token
   * @throws {UnauthorizedException} if the username is invalid
   */
  @UseGuards(LocalAuthGuard)
  @ApiOkResponse({
    description: 'Returns user information and tokens if sign-in is successful',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('signin')
  signIn(@Body() signInDto: SignInUserDto) {
    return this.authService.signIn(signInDto.username);
  }
  /**
   * Revokes the user's JWT token.
   * @param refreshTokenDto - User's refresh token information
   * @returns {succes} - Assumes all sign-out are successful
   * @throws {UnauthorizedException} if the refresh token is invalid
   */
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Sign Out',
    description: "Revokes the user's JWT token.",
  })
  @Post('signout')
  signOut(@Body() signOutDto: SignOutUserDto) {
    return this.authService.revokeToken(signOutDto)
      ? STATUS_CODES.successful
      : STATUS_CODES.error;
  }

  /**
   * Refresh the user's JWT token.
   * @param refreshTokenDto - User's refresh token information
   * @returns {Object} - Object containing access_token
   * @throws {UnauthorizedException} if the refresh token is invalid
   */
  @UseGuards(RefreshJwtGuard, JwtGuard)
  @ApiBearerAuth()
  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.username);
  }
}
