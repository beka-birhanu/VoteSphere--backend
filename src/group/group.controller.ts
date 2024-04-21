import { Body, Controller, Get, Param, Post, UseGuards, Req, NotFoundException, Delete, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { CreateGroupDto } from './dtos/createGroupDto.dto';
import { GroupService } from './group.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GetGroupDto } from './dtos/getGroupDto.dto';
import { Request } from 'express';

@ApiTags('groups')
@Controller('groups')
export class GroupController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly groupService: GroupService,
  ) {}

  /**
   * Create a new group.
   * @param createGroupDto - Group's information
   * @returns {Object} - Object containing the created group details
   * @throws {NotFoundException} if the requesting user does not exist
   * @throws {ConflictException} if the requesting admin already has a group
   * @throws {UnauthorizedException} if the user is not authorized to perform the operation
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Group', description: 'Create a new group. Requires Admin role.' })
  @ApiBody({ type: CreateGroupDto, description: 'Group information including admin username and group name.' })
  @ApiCreatedResponse({ description: 'Group created successfully.', type: GetGroupDto })
  @ApiResponse({ status: 401, description: 'Unauthorized: User lacks necessary permissions.' })
  @ApiResponse({ status: 404, description: 'Not Found: The requesting user does not exist.' })
  @ApiResponse({ status: 409, description: 'Conflict: The requesting admin already has a group.' })
  // Create a new group
  async createGroup(@Req() request: Request, @Body() createGroupDto: CreateGroupDto): Promise<GetGroupDto> {
    const token = request.headers.authorization.split(' ')[1];
    const header_adminUsername = this.jwtService.verify(token, {
      secret: `${process.env.JWT_SECRET}`,
    }).username;

    // if username in token and body don't match throw unauthorized error
    if (createGroupDto.adminUsername !== header_adminUsername) {
      throw new UnauthorizedException('User lacks necessary permissions');
    }

    return this.groupService.createGroup(createGroupDto);
  }

  /**
   * Get members of a group.
   * @param groupId - ID of the group
   * @returns {{username, email}[]} - Array containing the list of members
   * @throws {NotFoundException} if the provided group ID is invalid
   */
  @Roles(['Admin', 'User'])
  @Get(':groupId/members')
  @ApiOperation({ summary: 'Get Members', description: 'Get members of a group. Requires Admin or User role.' })
  @ApiOkResponse({
    description: 'Returns the list of members.',
    schema: { type: 'array', items: { type: 'object', properties: { username: { type: 'string' }, email: { type: 'string' } } } },
  })
  @ApiResponse({ status: 404, description: 'Not Found: The provided group ID is invalid.' })
  // get members
  async getMembers(@Param('groupId') groupId: string): Promise<{ username: string; email: string }[]> {
    const group = await this.groupService.findGroupById(groupId);
    // check the user is member of the group(not implemented)
    if (!group) {
      throw new NotFoundException('Invalid group ID');
    }

    return this.groupService.findMembers(groupId);
  }

  /**
   * Add Member to Group.
   * @param username - The username of the user to be added
   * @param groupId - ID of the group
   * @param request - The request object
   * @returns {string} - Message indicating success
   * @throws {NotFoundException} if the provided username is invalid
   * @throws {UnauthorizedException} if the current user is not the admin of the requested group
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post(':groupId/members')
  @ApiOperation({ summary: 'Add Member to Group', description: 'Add a user to a group. Requires Admin role.' })
  @ApiBearerAuth()
  @ApiBody({ schema: { properties: { username: { type: 'string', description: 'The username of the user.', example: 'beka_birhanu' } } } })
  @ApiResponse({ status: 200, description: 'Successful operation' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Current user is not admin for the requested group' })
  @ApiResponse({ status: 404, description: 'Not Found: Invalid username or admin must create a group before attempting to add members' })
  // add a member
  async addMemberToGroup(@Body('username') username: string, @Param('groupId') groupId: string, @Req() request: Request): Promise<string> {
    const authorizationHeader = request.headers['authorization'] as string;
    const token = authorizationHeader.split(' ')[1];

    const adminUsername = this.jwtService.verify(token, {
      secret: `${process.env.JWT_SECRET}`,
    }).username;

    const group = await this.groupService.findGroupByAdminUsername(adminUsername);

    if (!group) {
      throw new NotFoundException('Admins must create a group before attempting to add members');
    }

    if (group.id !== groupId) {
      throw new UnauthorizedException('current user is not admin for the requested group');
    }

    const user = await this.usersService.findOneByUsername(username);

    if (!user) {
      throw new NotFoundException('Invalid username');
    }

    if (user.role === 'Admin') {
      throw new ConflictException('There can only be one admin per group');
    }

    const userHasGroup = await this.usersService.userHasGroup(username);

    if (userHasGroup) {
      throw new ConflictException(`User '${user.username}' already belongs to a group.`);
    }

    return this.groupService.addMemberToGroup(user, group);
  }

  /**
   * Remove Member from Group.
   * @param username - The username of the user to be removed
   * @param groupId - ID of the group
   * @param request - The request object
   * @returns {string} - Message indicating success
   * @throws {NotFoundException} if the provided username is invalid
   * @throws {UnauthorizedException} if the user doesn't have permission for the requested group
   */
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Delete(':groupId/members')
  @ApiOperation({ summary: 'Remove Member from Group', description: 'Remove a user from a group. Requires Admin role.' })
  @ApiBearerAuth()
  @ApiBody({ schema: { properties: { username: { type: 'string', description: 'The username of the user.', example: 'beka_birhanu' } } } })
  @ApiResponse({ status: 200, description: 'Successful operation' })
  @ApiResponse({ status: 401, description: 'Unauthorized: User does not have permission for the requested group' })
  @ApiResponse({ status: 404, description: 'Not Found: Invalid username or admin must create a group before attempting to remove members' })
  // remove a member
  async removeMemberFromGroup(@Body('username') username: string, @Param('groupId') groupId: string, @Req() request: Request): Promise<string> {
    const authorizationHeader = request.headers['authorization'] as string;
    const token = authorizationHeader.split(' ')[1];

    const adminUsername = this.jwtService.verify(token, {
      secret: `${process.env.JWT_SECRET}`,
    }).username;

    const group = await this.groupService.findGroupByAdminUsername(adminUsername);

    if (!group) {
      throw new NotFoundException('Admins must create a group before attempting to remove members');
    }

    if (group.id != groupId) {
      throw new UnauthorizedException('user dont have permission for the requested group');
    }

    const user = await this.usersService.findOneByUsernameWithGroup(username);

    if (!user) {
      throw new NotFoundException('Invalid username');
    }

    if (user.role === 'Admin') {
      throw new BadRequestException('Admins can not leave there own group');
    }

    return await this.groupService.removeMemberFromGroup(user, group);
  }
}
