import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';

@Controller('users')
export class UserController {
  @UseGuards(JwtGuard)
  @Get(':userName/posts')
  getPost(@Param('userName') userName: string) {
    return { message: `Fetching posts for user: ${userName}` };
  }
}
