import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { PollService } from './poll.service';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AddPollDto } from './dtos/addPollDto.dto';
import { Poll } from 'src/typeORM/entities/poll';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { Request } from 'express';
import { STATUS_CODES } from 'http';
import { GroupService } from 'src/group/group.service';
import { PollDtoResponse } from './dtos/addPollResponseDto.dto';

@ApiTags('polls')
@Controller('polls')
export class PollController {
  constructor(
    private readonly pollService: PollService,
    private readonly authService: AuthService,
    private readonly groupService: GroupService,
  ) {}

  /**
   * Controller method to create a new poll.
   * @param {Request} request - The HTTP request object.
   * @param {AddPollDto} addPollDto - The data required to create the new poll.
   * @returns {Promise<Poll>} A promise that resolves to the newly created poll.
   * @throws {UnauthorizedException} If the user lacks necessary permissions.
   * @throws {NotFoundException} If the admin does not have a group.
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post()
  @ApiOperation({ summary: 'Add Poll', description: 'Create a new poll' })
  @ApiBearerAuth()
  @ApiBody({ type: AddPollDto })
  @ApiResponse({ status: 201, description: 'Created', type: PollDtoResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized, if the user lacks necessary permissions.' })
  @ApiResponse({ status: 404, description: 'Not Found, if the admin does not have a group.' })
  //
  async addPoll(@Req() request: Request, @Body() addPollDto: AddPollDto): Promise<Poll> {
    const token = request.headers.authorization.split(' ')[1];
    const headerAdminUsername = this.authService.decodeToken(token)?.username;

    // Check if the admin username in the request matches the username from the token
    if (addPollDto.adminUsername !== headerAdminUsername) {
      throw new UnauthorizedException('The token sent does not belong to the user');
    }

    return this.pollService.addPoll(addPollDto);
  }

  /**
   * Controller method to delete a poll by its ID.
   * @param {Request} request - The HTTP request object.
   * @param {string} pollId - The ID of the poll to delete.
   * @param {string} adminUsername - The username of the admin deleting the poll.
   * @returns {Promise<string>} A promise resolving to a success message.
   * @throws {UnauthorizedException} If the token does not belong to the user.
   * @throws {NotFoundException} If the poll is not found or if the admin username is invalid.
   * @throws {BadRequestException} If the poll has received votes and cannot be deleted.
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Delete(':pollId')
  @ApiOperation({ summary: 'Delete Poll', description: 'Delete a poll by ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'pollId', type: 'string' })
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  //
  async deletePoll(@Req() request: Request, @Param('pollId') pollId: string, @Body('adminUsername') adminUsername: string): Promise<string> {
    const token = request.headers.authorization.split(' ')[1];
    const headerAdminUsername = this.authService.decodeToken(token)?.username;

    if (adminUsername !== headerAdminUsername) {
      throw new UnauthorizedException('The token sent does not belong to the user');
    }

    return this.pollService.removePoll(pollId, adminUsername);
  }

  /**
   * Controller method to close a poll by its ID, preventing further voting.
   * @param {Request} request - The HTTP request object.
   * @param {string} pollId - The ID of the poll to close.
   * @param {string} adminUsername - The username of the admin closing the poll.
   * @returns {Promise<string>} A promise resolving to a success message.
   * @throws {UnauthorizedException} If the token does not belong to the user.
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Patch(':pollId/close')
  @ApiOperation({ summary: 'Close Poll', description: 'Close a poll by ID to prevent further voting' })
  @ApiBearerAuth()
  @ApiParam({ name: 'pollId', type: 'string' })
  @ApiResponse({ status: 200, description: 'OK' })
  async closePoll(@Req() request: Request, @Param('pollId') pollId: string, @Body('adminUsername') adminUsername: string): Promise<string> {
    // Extract admin username from JWT token
    const token = request.headers.authorization.split(' ')[1];
    const headerAdminUsername = this.authService.decodeToken(token)?.username;

    // Verify that the admin username from the request matches the one from the token
    if (adminUsername !== headerAdminUsername) {
      throw new UnauthorizedException('The token sent does not belong to the user');
    }

    // Call the poll service to close the poll
    await this.pollService.closePoll(pollId, adminUsername);

    // Return a success message
    return STATUS_CODES.success;
  }

  /**
   * Controller method to vote on a poll by its ID with the specified option.
   * @param {Request} request - The HTTP request object.
   * @param {string} pollId - The ID of the poll to vote on.
   * @param {string} optionId - The ID of the option to vote for.
   * @param {string} username - The username of the user casting the vote.
   * @returns {Promise<Poll>} A promise resolving to the updated poll after voting.
   * @throws {UnauthorizedException} If the token does not belong to the user.
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin', 'User'])
  @Patch(':pollId/vote')
  @ApiOperation({ summary: 'Vote on Poll', description: 'Vote on a poll by ID with the specified option' })
  @ApiBearerAuth()
  @ApiParam({ name: 'pollId', type: 'string' })
  @ApiResponse({ status: 200, description: 'OK', type: Poll })
  async vote(
    @Req() request: Request,
    @Param('pollId') pollId: string,
    @Query('optionId') optionId: string,
    @Body('username') username: string,
  ): Promise<Poll> {
    // Extract username from JWT token
    const token = request.headers.authorization.split(' ')[1];
    const headerUsername = this.authService.decodeToken(token)?.username;

    // Verify that the username from the request matches the one from the token
    if (username !== headerUsername) {
      throw new UnauthorizedException('The token sent does not belong to the user');
    }

    // Call the poll service to cast the vote
    return await this.pollService.castVote(pollId, optionId, username);
  }

  /**
   * Controller method to retrieve polls by specifying a group ID.
   * @param {Request} request - The HTTP request object.
   * @param {string} groupId - The ID of the group to retrieve polls for.
   * @param {string} username - The username of the user requesting the polls.
   * @returns {Promise<Poll[]>} A promise resolving to an array of polls associated with the specified group.
   * @throws {UnauthorizedException} If the token does not belong to the user or if the user does not belong to the requested group.
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin', 'User'])
  @Get()
  @ApiOperation({ summary: 'Get Polls', description: 'Get polls by specifying a group ID' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'groupId', type: 'string' })
  @ApiResponse({ status: 200, description: 'OK', type: [Poll] })
  async getPolls(@Req() request: Request, @Query('groupId') groupId: string, @Body('username') username: string): Promise<Poll[]> {
    // Extract username from JWT token
    const token = request.headers.authorization.split(' ')[1];
    const headerUsername = this.authService.decodeToken(token)?.username;

    // Verify that the username from the request matches the one from the token
    if (username !== headerUsername) {
      throw new UnauthorizedException('The token sent does not belong to the user');
    }

    // Verify that the user belongs to the requested group
    if (!(await this.groupService.belongsTo(username, groupId))) {
      throw new UnauthorizedException('The user does not belong to the requested group');
    }

    // Retrieve polls associated with the specified group ID
    return await this.pollService.getPollsByGroupId(groupId);
  }
}
