import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUserDto.dto';
import { promises } from 'dns';

export type User = {
  userName: string;
  email: string;
  password: string;
  role: string[];
};

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      userName: 'beka',
      email: 'beka@gmail.com',
      password: '$2b$10$uzlJHEFlfsB2TKK0OWTLXu8IXHXs12SAeyeu3heHB.98ZrAQRf/LC',
      role: ['Admin', 'User'],
    },
    {
      userName: 'beka-birhanu',
      email: 'bekabirhanu@gmail.com',
      password: '$2b$10$uzlJHEFlfsB2TKK0OWTLXu8IXHXs12SAeyeu3heHB.98ZrAQRf/LC',
      role: ['user'],
    },
  ];

  async findOne(userName: string): Promise<User | undefined> {
    return this.users.find((user) => user.userName === userName);
  }
  async createUser(createUserDto: CreateUserDto) {}

  async getUserRole(userName: string): Promise<string[] | undefined> {
    const user = await this.findOne(userName);
    return user.role;
  }
}
