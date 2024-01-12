import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PollService } from './poll.service';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreatePollDto } from './dtos/createPollDto.dto';
import { Poll } from 'src/typeORM/entities/poll';

@Controller('poll')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post('create')
  async createPoll(@Body() createPollDto: CreatePollDto): Promise<Poll> {
    return await this.pollService.addPoll(createPollDto);
  }
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Delete(':pollId/delete')
  async deletePoll(
    @Param('pollId') pollId: number,
    @Body() adminUsername: string,
  ): Promise<void> {
    await this.pollService.removePoll(pollId, adminUsername);
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post(':pollId/close')
  async closePoll(@Param('pollId') pollId: number): Promise<void> {
    await this.pollService.closePoll(pollId);
  }
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin', 'User'])
  @Post(':pollId/vote')
  async vote(
    @Param('pollId') pollId: number,
    @Body('optionId') optionId: number,
    @Body('username') username: string,
  ): Promise<Poll> {
    return await this.pollService.voteOnPoll(pollId, optionId, username);
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin', 'User'])
  @Get(':groupId/polls')
  async getPolls(@Param('groupId') groupId: number): Promise<Poll[]> {
    return await this.pollService.getPollsByGroupId(groupId);
  }
}
