import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './../typeORM/entities/group';
import { CreateGroupDto } from './dtos/createGroupDto.dto';
import { UsersService } from 'src/users/users.service';
import { GetGroupDto } from './dtos/getGroupDto.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly usersService: UsersService,
  ) {}

  async createGroup(createGroupDto: CreateGroupDto): Promise<GetGroupDto> {
    const adminUser = await this.usersService.findOne(
      createGroupDto.adminUsername,
    );

    if (!adminUser) {
      throw new NotFoundException(
        `User with username ${createGroupDto.adminUsername} not found.`,
      );
    }
    const existingGroup = await this.findByAdminUsername(
      createGroupDto.adminUsername,
    );
    if (existingGroup) {
      throw new BadRequestException('Admin can create only one group.');
    }

    const group = new Group();
    group.groupName = createGroupDto.groupName;

    group.admin = adminUser;

    const newGroup = await this.groupRepository.save(group);
    adminUser.group = newGroup;
    this.usersService.updateUser(adminUser);
    if (newGroup) {
      const groupDto = {
        groupId: group.id,
        groupName: group.groupName,
        adminUsername: group.admin.username,
      };
      return groupDto;
    }
  }

  async findByAdminUsername(adminUsername: string): Promise<Group | undefined> {
    try {
      const group = await this.groupRepository.findOne({
        where: { admin: { username: adminUsername } },
      });

      if (!group) {
        return null;
      }

      return group;
    } catch (error) {
      return null;
    }
  }
  async findById(groupId: number) {
    try {
      const group = await this.groupRepository.findOne({
        where: { id: groupId },
      });
      if (!group) {
        return null;
      }

      return group;
    } catch (error) {
      return null;
    }
  }
  async findMemders(groupId: number) {
    return await this.usersService.getUsersByGroupId(groupId);
  }
}
