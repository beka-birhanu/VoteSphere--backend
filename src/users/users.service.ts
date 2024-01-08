import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUserDto.dto';
import { promises } from 'dns';

export type User = {
  username: string;
  email: string;
  password: string;
  role: string;
  blackList: any[];
};

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      username: 'beka',
      email: 'beka@gmail.com',
      password: '$2b$10$uzlJHEFlfsB2TKK0OWTLXu8IXHXs12SAeyeu3heHB.98ZrAQRf/LC',
      role: 'Admin',
      blackList: [],
    },
    {
      username: 'beka-birhanu',
      email: 'bekabirhanu@gmail.com',
      password: '$2b$10$uzlJHEFlfsB2TKK0OWTLXu8IXHXs12SAeyeu3heHB.98ZrAQRf/LC',
      role: 'user',
      blackList: [],
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(
      (user) => user.username === username || user.email === username,
    );
  }
  async createUser(createUserDto: CreateUserDto) {
    const newUser: User = { ...createUserDto, blackList: [] };

    this.users.push(newUser);
  }

  async getUserRole(username: string): Promise<string | undefined> {
    const user = await this.findOne(username);
    return user.role;
  }
  async addBlackListToken(username: string, token: string) {
    const user = await this.findOne(username);
    user.blackList.push(token);
  }
  async getBlacklist(username: string): Promise<string[]> {
    const user = await this.findOne(username);
    return user.blackList;
  }
}
