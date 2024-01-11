import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { MembershipService } from './membership.service';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { GroupService } from 'src/group/group.service';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { STATUS_CODES } from 'http';

@Controller('groupmembership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly groupService: GroupService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post('add')
  async addMemberToGroup(
    @Body('username') username: string,
    @Req() request: Request,
  ): Promise<string> {
    const authorizationHeader = request.headers['authorization'] as string;
    const token = authorizationHeader.split(' ')[1]; // Extract the token from the Authorization header.

    // Get the username from the token using the AuthService.
    const adminUsername = this.jwtService.verify(token, {
      secret: `${process.env.JWT_SECRET}`,
    }).username;

    const group = await this.groupService.findByAdminUsername(adminUsername);

    if (!group) {
      throw new NotFoundException(
        'Admins must create a group before attempting to add members',
      );
    }

    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new NotFoundException('Invalid username');
    }
    try {
      await this.membershipService.addMemberToGroup(user, group);
      return STATUS_CODES.successful;
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post('remove')
  async removeMemberToGroup(
    @Body('username') username: string,
    @Req() request: Request,
  ): Promise<string> {
    const authorizationHeader = request.headers['authorization'] as string;
    const token = authorizationHeader.split(' ')[1]; // Extract the token from the Authorization header.

    // Get the username from the token using the AuthService.
    const adminUsername = this.jwtService.verify(token, {
      secret: `${process.env.JWT_SECRET}`,
    }).username;

    const group = await this.groupService.findByAdminUsername(adminUsername);

    if (!group) {
      throw new NotFoundException(
        'Admins must create a group before attempting to remove members',
      );
    }

    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new NotFoundException('Invalid username');
    }

    try {
      await this.membershipService.removeMemberFromGroup(user, group);
      return STATUS_CODES.successful;
    } catch (error) {
      throw error;
    }
  }
}
