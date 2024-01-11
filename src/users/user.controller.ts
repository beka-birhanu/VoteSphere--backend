import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtGuard)
  @Get(':username/posts')
  getPost(@Param('username') username: string) {
    return { message: `Fetching posts for user: ${username}` };
  }
}
