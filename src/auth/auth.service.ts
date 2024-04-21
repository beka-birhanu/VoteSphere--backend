import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dtos/createUserDto.dto';
import * as zxcvbn from 'zxcvbn';
import { ApiTags } from '@nestjs/swagger';
import { SignOutUserDto } from './dtos/signOutUserDto.dto';
import { SignInResponseDto } from './dtos/signInResponseDto.dto';

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
   * @returns {SignInResponseDto} - Object containing access_token and refresh_token upon successful sign-up
   * @throws {ConflictException} if a user with the same username or email already exists
   * @throws {BadRequestException} if the password is not strong enough
   * @throws {InternalServerErrorException} if an unexpected error occurs
   */
  async signUp(createUserDto: CreateUserDto): Promise<SignInResponseDto> {
    // Check if email or username already exists
    const isEmailUsed = await this.usersService.findOneByEmail(createUserDto.email);
    const isUserNameUsed = await this.usersService.findOneByUsername(createUserDto.username);

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

    try {
      // Create the user and sign them in
      await this.usersService.createUser(createUserDto);
      return this.signIn(createUserDto.username);
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  /**
   * Sign in a user.
   * @param {string} username - User's username
   * @returns {SignInResponseDto} - User information and tokens if sign-in is successful
   * @throws {UnauthorizedException} if the username is invalid or sign-in fails
   */
  async signIn(username: string): Promise<SignInResponseDto> {
    // Find user by username and extract email for payload and role
    const user = await this.usersService.findOneByUsername(username);
    const role = user.role;
    const email = user.email;
    let group_id = null;
    if (user.group) {
      group_id = user.group.id;
    }
    const acceess_payload = { email: email, username: username };
    const refresh_payload = { username: username, role: role };

    // Sign and return both access and refresh tokens
    const access_token = await this.jwtService.signAsync(acceess_payload);
    const refresh_token = await this.jwtService.signAsync(refresh_payload, {
      expiresIn: '30d',
    });

    return { username, role, group_id, access_token, refresh_token };
  }

  /**
   * Refresh a user's JWT token.
   * @param username - User's username
   * @returns { access_token } - New JWT token if refresh is successful
   */
  async refreshToken(username: string): Promise<{ access_token: string }> {
    // Find user by username and extract email for payload
    const user = await this.usersService.findOneByUsername(username);

    if (!user) {
      throw new BadRequestException('No such username');
    }
    const email = user.email;
    const payload = { email: email, username: username };

    // Sign and return a new access token for refresh
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  /**
   * Revokes a user's JWT token.
   * @param username - User's username
   * @returns { boolean} - Assumes All JWT token  revocking is successful
   */
  async revokeToken(signOutDto: SignOutUserDto): Promise<boolean> {
    // Find user by username and extract email for payload
    const { username, token } = signOutDto;
    const decodedToken = await this.decodeToken(token);

    if (decodedToken && decodedToken.role) {
      this.usersService.addBlackListToken(username, token);
      return true;
    }

    throw new BadRequestException('Provided token does not match the token in the header');
  }

  /**
   * Validate a user's password.
   * @param username - User's username
   * @param plainTextPassword - User's plain text password
   * @returns {boolean} - 0 if the password is valid, 1 if the username is invalid, 2 if the password is invalid, 3 if there is an error
   */
  async validatePassword(username: string, plainTextPassword: string): Promise<boolean> {
    // Find user by username
    const user = await this.usersService.findOneByUsername(username);

    // If user not found, return invalid username
    if (!user) {
      throw new UnauthorizedException('Invalid username');
    }

    // Compare plain text password with hashed password
    const passwordCheck = await bcrypt.compare(plainTextPassword, user.password);

    // Return result based on password check
    if (!passwordCheck) {
      throw new UnauthorizedException('Invalid password');
    }

    return true;
  }

  // Decode the token using the JWT service
  decodeToken(token: string): any {
    try {
      return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    } catch (error) {
      return null;
    }
  }
}
