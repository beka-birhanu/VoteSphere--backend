import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dtos/createUserDto.dto';
import * as zxcvbn from 'zxcvbn';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Sign up a new user.
   * @param createUserDto - User's sign-up information
   * @returns { access_token, refresh_token } - Tokens if sign-up is successful
   * @throws ConflictException if a user with the same username or email already exists
   * @throws BadRequestException if the password is not strong enough
   */
  async signUp(
    createUserDto: CreateUserDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Check if email or username already exists
    const isEmailUsed = await this.usersService.findOne(createUserDto.email);
    const isUserNameUsed = await this.usersService.findOne(
      createUserDto.userName,
    );

    // Throw exceptions if the email or username is already in use
    if (isUserNameUsed) {
      throw new ConflictException('User with this username already exists');
    }
    if (isEmailUsed) {
      throw new ConflictException('User with this email already exists');
    }

    // Check password strength using zxcvbn library
    const passwordScore = zxcvbn(createUserDto.password).score;
    if (passwordScore < 3) {
      throw new BadRequestException('Password is not strong enough');
    }

    // Create the user and sign them in, returning tokens
    await this.usersService.createUser(createUserDto);
    return await this.signIn(createUserDto.userName);
  }

  /**
   * Sign in a user.
   * @param userName - User's username
   * @returns { userName, access_token, refresh_token } - User information and tokens if sign-in is successful
   * @throws UnauthorizedException if the username is invalid
   */
  async signIn(userName: string): Promise<{
    userName: string;
    access_token: string;
    refresh_token: string;
  }> {
    // Find user by username and extract email for payload
    const email = (await this.usersService.findOne(userName)).email;
    const payload = { email: email, userName: userName };

    // Sign and return both access and refresh tokens
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '3w',
    });

    return { userName, access_token, refresh_token };
  }

  /**
   * Validate a user's password.
   * @param userName - User's username
   * @param plainTextPassword - User's plain text password
   * @returns {number} - 0 if the password is valid, 1 if the username is invalid, 2 if the password is invalid, 3 if there is an error
   */
  async validatePassword(
    userName: string,
    plainTextPassword: string,
  ): Promise<number> {
    try {
      // Find user by username
      const user = await this.usersService.findOne(userName);

      // If user not found, return invalid username
      if (!user) {
        return 1; // Invalid username
      }

      // Compare plain text password with hashed password
      const passwordCheck = await bcrypt.compare(
        plainTextPassword,
        user.password,
      );

      // Return result based on password check
      return passwordCheck ? 0 : 2; // 0 if valid, 2 if invalid
    } catch (error) {
      return 3; // Error
    }
  }

  /**
   * Refresh a user's JWT token.
   * @param userName - User's username
   * @returns { access_token } - New JWT token if refresh is successful
   */
  async refreshToken(userName: string): Promise<{ access_token: string }> {
    // Find user by username and extract email for payload
    const email = (await this.usersService.findOne(userName)).email;
    const payload = { email: email, userName: userName };

    // Sign and return a new access token for refresh
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }
}
