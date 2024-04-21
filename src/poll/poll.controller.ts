import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PollService } from './poll.service';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreatePollDto } from './dtos/createPollDto.dto';
import { Poll } from 'src/typeORM/entities/poll';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('polls')
@Controller('polls')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post()
  @ApiOperation({ summary: 'Create Poll', description: 'Create a new poll' })
  @ApiBearerAuth()
  @ApiBody({ type: CreatePollDto })
  @ApiResponse({ status: 201, description: 'Created' })
  async createPoll(@Body() createPollDto: CreatePollDto): Promise<Poll> {
    return await this.pollService.addPoll(createPollDto);
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Delete(':pollId')
  @ApiOperation({ summary: 'Delete Poll', description: 'Delete a poll by ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'pollId', type: 'string' })
  @ApiResponse({ status: 204, description: 'No Content' })
  async deletePoll(
    @Param('pollId') pollId: string,
    @Body() adminUsername: string,
  ): Promise<void> {
    await this.pollService.removePoll(pollId, adminUsername);
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Patch(':pollId/close')
  @ApiOperation({
    summary: 'Close Poll',
    description: 'Close a poll by ID to prevent further voting',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'pollId', type: 'string' })
  @ApiResponse({ status: 200, description: 'OK' })
  async closePoll(@Param('pollId') pollId: string): Promise<void> {
    await this.pollService.closePoll(pollId);
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin', 'User'])
  @Patch(':pollId/vote')
  @ApiOperation({
    summary: 'Vote on Poll',
    description: 'Vote on a poll by ID with the specified option',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'pollId', type: 'string' })
  @ApiResponse({ status: 200, description: 'OK', type: Poll })
  async vote(
    @Param('pollId') pollId: string,
    @Body('optionId') optionId: string,
    @Body('username') username: string,
  ): Promise<Poll> {
    return await this.pollService.voteOnPoll(pollId, optionId, username);
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin', 'User'])
  @Get()
  @ApiOperation({
    summary: 'Get Polls',
    description: 'Get polls by specifying a group ID',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'groupId', type: 'number' })
  @ApiResponse({ status: 200, description: 'OK', type: [Poll] })
  async getPolls(@Query('groupId') groupId: number): Promise<Poll[]> {
    return await this.pollService.getPollsByGroupId(groupId);
  }
}
