import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PollService } from './poll.service';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreatePollDto } from './dtos/createPollDto.dto';

@Controller('poll')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post('create')
  async createPoll(@Body() createPollDto: CreatePollDto): Promise<void> {
    await this.pollService.addPoll(createPollDto);
  }
}
