import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUserDto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeORM/entities/user';
import * as bcrypt from 'bcrypt';

// private users: User[] = [
//   {
//     username: 'beka',
//     email: 'beka@gmail.com',
//     password: '$2b$10$uzlJHEFlfsB2TKK0OWTLXu8IXHXs12SAeyeu3heHB.98ZrAQRf/LC',
//     role: 'Admin',
//     blackList: [],
//   },
//   {
//     username: 'beka-birhanu',
//     email: 'bekabirhanu@gmail.com',
//     password: '$2b$10$uzlJHEFlfsB2TKK0OWTLXu8IXHXs12SAeyeu3heHB.98ZrAQRf/LC',
//     role: 'user',
//     blackList: [],
//   },
// ];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(usernameOrEmail: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
  }
  async createUser(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    const newUser: User = this.userRepository.create({
      ...createUserDto,
      tokenBlackList: null,
    });

    await this.userRepository.save(newUser);
  }

  async getUserRole(username: string): Promise<string | undefined> {
    const user = await this.findOne(username);
    return user?.role;
  }

  async addBlackListToken(username: string, token: string): Promise<void> {
    const user = await this.findOne(username);

    if (!user) {
      throw new NotFoundException(
        `User with username '${username}' not found.`,
      );
    }

    if (!user.tokenBlackList) {
      user.tokenBlackList = [];
    }

    user.tokenBlackList.push(token);
    await this.userRepository.save(user);
  }
  async getBlacklist(username: string): Promise<string[]> {
    const user = await this.findOne(username);
    return user ? user.tokenBlackList : [];
  }
}
