import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInUserDto } from './dtos/signInUserDto.dto';
import { LocalAuthGuard } from './guards/localAuth.guard';
import { RefreshJwtGuard } from './guards/refreshJwtToken.guard';
import { CreateUserDto } from 'src/users/dtos/createUserDto.dto';
import { RefreshTokenDto } from './dtos/refreshTokenDto.dto';
import { SignInResponseDto } from './dtos/signInResponseDto.dto';
import { SignOutUserDto } from './dtos/signOutUserDto.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Sign Up',
    description: 'Create a new user account.',
  })
  @ApiOkResponse({
    description: 'Returns user details and authentication tokens upon successful sign-up',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: A user with the same username or email already exists.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: The password provided is not strong enough.',
  })
  async signUpUser(@Body() createUserDto: CreateUserDto): Promise<SignInResponseDto> {
    return this.authService.signUp(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @ApiOperation({
    summary: 'Sign In',
    description: 'Authenticate and sign in a user.',
  })
  @ApiOkResponse({
    description: 'Returns user details and authentication tokens upon successful sign-in',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Invalid username or password',
  })
  async signIn(@Body() signInDto: SignInUserDto): Promise<SignInResponseDto> {
    return this.authService.signIn(signInDto.username);
  }

  @UseGuards(RefreshJwtGuard)
  @Get('refresh-token')
  @ApiOperation({
    summary: 'Refresh Authentication Token',
    description: "Obtain a new access token by refreshing the user's authentication token.",
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
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string }> {
    return this.authService.refreshToken(refreshTokenDto.username);
  }

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
    description: 'Bad Request: Provided token in the body does not match the token in the header',
  })
  async signOut(@Body() signOutDto: SignOutUserDto): Promise<string> {
    return this.authService.revokeToken(signOutDto);
  }
}
