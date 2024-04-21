import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './../typeORM/entities/group';
import { CreateGroupDto } from './dtos/createGroupDto.dto';
import { UsersService } from 'src/users/users.service';
import { GetGroupDto } from './dtos/getGroupDto.dto';
import { User } from 'src/typeORM/entities/user';
import { STATUS_CODES } from 'http';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly usersService: UsersService,
  ) {}

  async createGroup(createGroupDto: CreateGroupDto): Promise<GetGroupDto> {
    // Find the admin user based on the provided username
    const adminUser = await this.usersService.findOneByUsername(createGroupDto.adminUsername);

    // If admin user doesn't exist, throw NotFoundException
    if (!adminUser) {
      throw new NotFoundException(`User with username ${createGroupDto.adminUsername} not found.`);
    }

    // Check if the admin already has a group, if yes, throw ConflictException
    const existingGroup = await this.findGroupByAdminUsername(createGroupDto.adminUsername);
    if (existingGroup) {
      throw new ConflictException('Admin can create only one group.');
    }

    // Create a new Group instance
    const group = new Group();
    group.groupName = createGroupDto.groupName;
    group.admin = adminUser;

    // Save the new group to the database
    const newGroup = await this.groupRepository.save(group);

    // Update the admin user's group association
    adminUser.group = newGroup;
    this.usersService.updateUser(adminUser);

    // If the group is successfully created, construct and return the group DTO
    if (newGroup) {
      const groupDto = {
        groupId: group.id,
        groupName: group.groupName,
        adminUsername: group.admin.username,
      };

      return groupDto;
    } else {
      // If there is an error during group creation, throw InternalServerErrorException
      throw new InternalServerErrorException();
    }
  }

  async findMembers(groupId: string): Promise<{ username: string; email: string }[]> {
    // Call the usersService to retrieve users belonging to the specified group ID
    return this.usersService.getUsersByGroupId(groupId);
  }

  async addMemberToGroup(user: User, group: Group) {
    // Update the user's group association
    user.group = group;

    try {
      // Save the updated user entity
      await this.usersService.updateUser(user);
      // Return a success message or status code
      return STATUS_CODES.successful;
    } catch (error) {
      // If an error occurs during the update, throw a BadRequestException
      throw new BadRequestException(error.message || 'Bad Request');
    }
  }

  async removeMemberFromGroup(user: User, group: Group) {
    // Check if the user is a member of the provided group
    if (!user.group || user.group.id != group.id) {
      throw new BadRequestException(`User '${user.username}' is not a member of your group`);
    }

    // Remove the user's group association
    user.group = null;

    try {
      // Save the updated user entity
      await this.usersService.updateUser(user);
      // Return a success message or status code
      return STATUS_CODES.successful;
    } catch (error) {
      // If an error occurs during the update, throw a BadRequestException
      throw new BadRequestException(error.message || 'Bad Request');
    }
  }

  async findGroupByAdminUsername(adminUsername: string): Promise<Group | undefined> {
    // Use the groupRepository to find a group by admin username
    return this.groupRepository.findOne({
      where: { admin: { username: adminUsername } }, // Query based on admin username
    });
  }

  async findGroupById(groupId: string) {
    // Use the groupRepository to find a group by its ID
    return this.groupRepository.findOne({
      where: { id: groupId }, // Query based on group ID
    });
  }

  async findGroupByIdWithAdmin(groupId: string) {
    return this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['admin_username'],
    });
  }

  async deleteGroup(groupId: string) {
    await this.groupRepository.delete(groupId);
  }
}
