import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import { SignOutUserDto } from './dtos/signOutUserDto.dto';
import { STATUS_CODES } from 'http';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Sign up a new user.
   * @param signUpUserDto - User's sign-up information
   * @createUserDto: CreateUserDto, ipAddress: anying username, access_token, and refresh_token
   * @throws {ConflictException} if a user with the same username or email already exists
   * @throws {BadRequestException} if the password is not strong enough
   */
  @Post('signup')
  @ApiOperation({
    summary: 'Sign Up',
    description: 'Sign up a new user.',
  })
  @ApiOkResponse({
    description: 'Returns user information and tokens if sign-up is successful',
  })
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
  @Post('signin')
  @ApiOperation({
    summary: 'Sign In',
    description: 'Sign in a user.',
  })
  @ApiOkResponse({
    description: 'Returns user information and tokens if sign-in is successful',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  signIn(@Body() signInDto: SignInUserDto) {
    return this.authService.signIn(signInDto.username);
  }

  /**
   * Refresh the user's JWT token.
   * @param refreshTokenDto - User's refresh token information
   * @returns {Object} - Object containing access_token
   * @throws {UnauthorizedException} if the refresh token is invalid
   */
  @UseGuards(RefreshJwtGuard)
  @Get('refresh-token')
  @ApiOperation({
    summary: 'Refresh Token',
    description: "Refresh the user's JWT token.",
  })
  @ApiResponse({
    status: 200,
    type: Object, // Specify the response type
    description:
      'Returns object containing access_token if refresh is successful',
  })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.username);
  }

  /**
   * Revokes the user's JWT token.
   * @param signOutDto - User's sign-out information
   * @returns {success} - Assumes all sign-outs are successful
   * @throws {UnauthorizedException} if the refresh token is invalid
   */
  @UseGuards(RefreshJwtGuard)
  @Patch('signout')
  @ApiOperation({
    summary: 'Sign Out',
    description: "Revokes the user's JWT token.",
  })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signOut(@Body() signOutDto: SignOutUserDto) {
    const ok = await this.authService.revokeToken(signOutDto);

    if (!ok) {
      throw new BadRequestException('send the same token as in the header');
    }

    return STATUS_CODES.successful;
  }
}
