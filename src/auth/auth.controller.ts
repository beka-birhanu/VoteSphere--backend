import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInUserDto } from './dtos/signInUserDto.dto';
import { LocalAuthGuard } from './guards/localAuth.guard';
import { RefreshJwtGuard } from './guards/refreshJwtToken.guard';
import { CreateUserDto } from 'src/users/dtos/createUserDto.dto';
import { RefreshTokenDto } from './dtos/refreshTokenDto.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Sign in a user.
   * @param signInDto - User's sign-in information
   * @returns {Object} - Object containing userName, access_token, and refresh_token
   * @throws {UnauthorizedException} if the username is invalid
   */
  @UseGuards(LocalAuthGuard)
  @ApiOkResponse({
    description: 'Returns user information and tokens if sign-in is successful',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('signin')
  signIn(@Body() signInDto: SignInUserDto) {
    return this.authService.signIn(signInDto.userName);
  }

  /**
   * Sign up a new user.
   * @param signUpUserDto - User's sign-up information
   * @returns {Object} - Object containing userName, access_token, and refresh_token
   * @throws {ConflictException} if a user with the same username or email already exists
   * @throws {BadRequestException} if the password is not strong enough
   */
  @Post('signup')
  async signUpUser(@Body() signUpUserDto: CreateUserDto) {
    return this.authService.signUp(signUpUserDto);
  }

  /**
   * Refresh the user's JWT token.
   * @param refreshTokenDto - User's refresh token information
   * @returns {Object} - Object containing access_token
   * @throws {UnauthorizedException} if the refresh token is invalid
   */
  @UseGuards(RefreshJwtGuard)
  @ApiBearerAuth()
  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.userName);
  }
}
