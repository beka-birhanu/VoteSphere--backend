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
import { SignOutUserDto } from './dtos/signoutUserDto.dto';

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
      createUserDto.username,
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
    return await this.signIn(createUserDto.username);
  }

  /**
   * Sign in a user.
   * @param username - User's username
   * @returns { username, access_token, refresh_token } - User information and tokens if sign-in is successful
   * @throws UnauthorizedException if the username is invalid
   */
  async signIn(username: string): Promise<{
    username: string;
    role: string;
    access_token: string;
    refresh_token: string;
  }> {
    // Find user by username and extract email for payload and role
    const user = await this.usersService.findOne(username);
    const role = user.role;
    const email = user.email;
    const payload = { email: email, username: username };

    // Sign and return both access and refresh tokens
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '3m',
    });

    return { username, role, access_token, refresh_token };
  }

  /**
   * Refresh a user's JWT token.
   * @param username - User's username
   * @returns { access_token } - New JWT token if refresh is successful
   */
  async refreshToken(username: string): Promise<{ access_token: string }> {
    // Find user by username and extract email for payload
    const email = (await this.usersService.findOne(username)).email;
    const payload = { email: email, username: username };

    // Sign and return a new access token for refresh
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  /**
   * Revokes a user's JWT token.
   * @param username - User's username
   * @returns { void} - Assumes All JWT token  revocking is successful
   */
  async revokeToken(signOutDto: SignOutUserDto): Promise<boolean> {
    // Find user by username and extract email for payload
    const { username, token } = signOutDto;
    const isValid = this.verifyToken(token);
    if (isValid) {
      this.usersService.addBlackListToken(username, token);
      return true;
    }
    return false;
  }

  /**
   * Validate a user's password.
   * @param username - User's username
   * @param plainTextPassword - User's plain text password
   * @returns {number} - 0 if the password is valid, 1 if the username is invalid, 2 if the password is invalid, 3 if there is an error
   */
  async validatePassword(
    username: string,
    plainTextPassword: string,
  ): Promise<number> {
    try {
      // Find user by username
      const user = await this.usersService.findOne(username);

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

  private async verifyToken(token: string): Promise<boolean> {
    try {
      this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      return true;
    } catch (error) {
      return false;
    }
  }
}
