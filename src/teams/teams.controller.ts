import { Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';

@Controller('teams')
export class TeamsController {
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post('create')
  createTeam() {
    return 'hello';
  }
}
