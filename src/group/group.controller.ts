import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { CreateGroupDto } from './dtos/createGroupDto.dto';
import { GroupService } from './group.service';

@ApiTags('groups')
@Controller('groups')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(['Admin'])
  @Post()
  @ApiOperation({
    summary: 'Create Group',
    description: 'Create a new group. Requires Admin role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Group created successfully.',
    type: CreateGroupDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  @ApiBearerAuth()
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
      throw new HttpException(
        {
          success: false,
          message:
            error.message || 'An error occurred while creating the group.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(['Admin', 'user'])
  @Get(':groupId/members')
  @ApiOperation({
    summary: 'Get Members',
    description: 'Get members of a group. Requires Admin or User role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of members.',
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  @ApiOkResponse({
    description: 'Returns the list of members.',
  })
  async getMembers(@Param('groupId') groupId: number) {
    const group = await this.groupService.findById(groupId);
    if (!group) {
      throw new BadRequestException('Invalid group Id');
    }
    const members = await this.groupService.findMembers(groupId);
    return members;
  }
}
