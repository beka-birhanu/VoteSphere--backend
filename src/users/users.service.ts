import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUserDto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeORM/entities/user';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Asynchronously creates a new user based on the provided data.
   * Password is hashed using bcrypt with a salt.
   *
   * @param {CreateUserDto} createUserDto - The data object containing information for creating a new user.
   * @returns {Promise<User>} A Promise resolving to the newly created user.
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Generate a salt for password hashing
    const salt = await bcrypt.genSalt(10);

    // Hash the user's password using bcrypt
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

    // Create a new user object with hashed password and default token blacklist value
    const newUser: User = this.userRepository.create({
      ...createUserDto,
      tokenBlackList: null,
    });

    return this.userRepository.save(newUser);
  }

  /**
   * Asynchronously updates an existing user with the provided data.
   *
   * @param {User} user - The user object containing updated information.
   * @returns {Promise<User>} A Promise resolving to the updated user object.
   */
  async updateUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  /**
   * Asynchronously adds a token to the blacklist for a user identified by username.
   *
   * @param {string} username - The username of the user to whom the token will be added to the blacklist.
   * @param {string} token - The token to be added to the blacklist.
   * @returns {Promise<User>} A Promise resolving to the updated user object with the added token in the blacklist.
   * @throws {NotFoundException} Throws a NotFoundException if the user with the given username is not found.
   */
  async addBlackListToken(username: string, token: string): Promise<User> {
    // Find the user by username without including group information
    const user = await this.findOneByUsername(username, false);

    if (!user) {
      throw new NotFoundException(`User with username '${username}' not found.`);
    }

    if (!user.tokenBlackList) {
      user.tokenBlackList = [];
    }

    user.tokenBlackList.push(token);

    return this.userRepository.save(user);
  }

  /**
   * Asynchronously finds a user by their username, with an option to include associated group information.
   *
   * @param {string} username - The username of the user to find.
   * @param {boolean} withGroup - If true, includes associated group information; otherwise, excludes it.
   * @returns {Promise<User | undefined>} A Promise resolving to the found user or undefined if not found.
   */
  async findOneByUsername(username: string, withGroup: boolean): Promise<User | undefined> {
    const queryOptions: any = { where: { username: username } };

    if (withGroup) {
      queryOptions.relations = ['group'];
    }

    return this.userRepository.findOne(queryOptions);
  }

  /**
   * Asynchronously retrieves users belonging to a specific group by their group ID.
   *
   * @param {string} groupId - The ID of the group to which the users belong.
   * @returns {Promise<{ username: string; email: string; role: string }[]>}
   * A Promise resolving to an array of objects containing the username, email, and role of each user in the group.
   */
  async getUsersByGroupId(groupId: string): Promise<{ username: string; email: string; role: string }[]> {
    return this.userRepository.find({
      where: { group: { id: groupId } },
      select: ['username', 'email', 'role'],
    });
  }

  /**
   * Asynchronously retrieves the role of a user by their username.
   *
   * @param {string} username - The username of the user whose role is to be retrieved.
   * @returns {Promise<string | undefined>} A Promise resolving to the role of the user, or undefined if the user is not found.
   */
  async getUserRole(username: string): Promise<string | undefined> {
    // Find the user by username without including group information
    const user = await this.findOneByUsername(username, false);

    // Return the role of the user if found, otherwise return undefined
    return user?.role;
  }

  /**
   * Asynchronously retrieves the blacklist of tokens for a user identified by username.
   *
   * @param {string} username - The username of the user whose blacklist of tokens is to be retrieved.
   * @returns {Promise<string[]>} A Promise resolving to an array of tokens in the blacklist of the user, or an empty array if the user is not found.
   */
  async getBlacklistToken(username: string): Promise<string[]> {
    // Find the user by username without including group information
    const user = await this.findOneByUsername(username, false);

    // Return the user's token blacklist if user is found, otherwise return an empty array
    return user ? user.tokenBlackList : [];
  }

  /**
   * Asynchronously checks if an email is already used by any user.
   *
   * @param {string} email - The email to check for usage.
   * @returns {Promise<boolean>} A Promise resolving to true if the email is already used, or false otherwise.
   */
  async isEmailUsed(email: string): Promise<boolean> {
    // Find a user with the provided email
    const user = await this.userRepository.findOne({
      where: [{ email: email }],
    });

    // Return true if user is found (email is used), otherwise return false
    return !!user;
  }
}
