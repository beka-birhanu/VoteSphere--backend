import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
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
   * @param createUserDto - User's sign-up information
   * @throws {ConflictException} if a user with the same username or email already exists
   * @throws {BadRequestException} if the password is not strong enough
   */
  @Post('signup')
  @ApiOperation({
    summary: 'Sign Up',
    description: 'Create a new user account.',
  })
  @ApiOkResponse({
    description:
      'Returns user details and authentication tokens upon successful sign-up',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict: A user with the same username or email already exists.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: The password provided is not strong enough.',
  })
  async signUpUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  /**
   * Sign in a user.
   * @param signInDto - User's sign-in information
   * @returns {Object} - Object containing user details and tokens upon successful sign-in
   * @throws {UnauthorizedException} if the provided username is invalid
   */
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @ApiOperation({
    summary: 'Sign In',
    description: 'Authenticate and sign in a user.',
  })
  @ApiOkResponse({
    description:
      'Returns user details and authentication tokens upon successful sign-in',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Invalid username or password',
  })
  async signIn(@Body() signInDto: SignInUserDto) {
    return this.authService.signIn(signInDto.username);
  }

  /**
   * Refreshes the user's authentication token.
   * @param refreshTokenDto - User's refresh token data
   * @returns {Object} - Object containing a new access token
   * @throws {UnauthorizedException} if the provided refresh token is invalid
   */
  @UseGuards(RefreshJwtGuard)
  @Get('refresh-token')
  @ApiOperation({
    summary: 'Refresh Authentication Token',
    description:
      "Obtain a new access token by refreshing the user's authentication token.",
  })
  @ApiOkResponse({
    description: 'Returns a new access token upon successful refresh.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: The refresh token does not belong to the user.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid username provided.',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.username);
  }

  /**
   * Revokes the user's JWT token.
   * @param signOutDto - User's sign-out information
   * @returns {success} - Indicates successful sign-out
   * @throws {UnauthorizedException} if the refresh token is invalid
   * @throws {BadRequestException} if the provided token in the body does not match the token in the header
   */
  @UseGuards(RefreshJwtGuard)
  @Patch('signout')
  @ApiOperation({
    summary: 'Sign Out',
    description: "Revoke the user's JWT token.",
  })
  @ApiOkResponse({
    description: 'Success: JWT token revoked successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Invalid or expired refresh token',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request: Provided token in the body does not match the token in the header',
  })
  async signOut(@Body() signOutDto: SignOutUserDto) {
    return this.authService.revokeToken(signOutDto);
  }
}
