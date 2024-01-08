import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';

@Controller('users')
export class UserController {
  @UseGuards(JwtGuard)
  @Get(':username/posts')
  getPost(@Param('username') username: string) {
    return { message: `Fetching posts for user: ${username}` };
  }
}
