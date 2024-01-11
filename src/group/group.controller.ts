import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { CreateGroupDto } from './dtos/createGroupDto.dto';
import { GroupService } from './group.service';

@Controller('groups')
export class GroupController {
  constructor(private groupService: GroupService) {}
  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post('create')
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    try {
      // Create a new group
      const newGroup = await this.groupService.createGroup(createGroupDto);

      return {
        success: true,
        message: 'Group created successfully!',
        data: newGroup,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'An error occurred while creating the group.',
      };
    }
  }
  @Roles(['Admin', 'user'])
  @Get(':groupId/members')
  async getMembers(@Param('groupId') groupId: number) {
    const group = await this.groupService.findById(groupId);
    if (!group) {
      throw new BadRequestException('Invalid group Id');
    }
    const members = await this.groupService.findMemders(groupId);
    return members;
  }
}
