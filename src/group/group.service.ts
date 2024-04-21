import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './../typeORM/entities/group';
import { CreateGroupDto } from './dtos/createGroupDto.dto';
import { UsersService } from 'src/users/users.service';
import { GetGroupDto } from './dtos/getGroupDto.dto';
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

  async getMembers(groupId: string): Promise<{ username: string; email: string; is_admin: boolean }[]> {
    // Call the usersService to retrieve users belonging to the specified group ID
    const members = await this.usersService.getUsersByGroupId(groupId);

    // Transforming user elements based on their role
    const transformedMembers = members.map((user) => ({
      username: user.username,
      email: user.email,
      is_admin: user.role === 'Admin' ? true : false,
    }));

    return transformedMembers;
  }

  async addMemberToGroup(newMemberUsername: string, adminUsername: string, groupId: string) {
    const admin = await this.usersService.findOneByUsernameWithGroup(adminUsername);
    const group = admin.group;

    // If the admin don't have a group
    if (!group) {
      throw new NotFoundException('Admins must create a group before attempting to add members');
    }

    // If the admins group and the requested group ID don't match deny access
    if (group.id !== groupId) {
      throw new UnauthorizedException('current user is not admin for the requested group');
    }

    const newMember = await this.usersService.findOneByUsernameWithGroup(newMemberUsername);

    if (!newMember) {
      throw new NotFoundException('Invalid username');
    }

    if (newMember.role === 'Admin') {
      throw new ConflictException('There can only be one admin per group');
    }

    const userHasGroup = newMember.group !== null;

    if (userHasGroup) {
      throw new ConflictException(`User '${newMember.username}' already belongs to a group.`);
    }
    // Update the user's group association
    newMember.group = group;

    const saveSuccess = await this.usersService.updateUser(newMember);

    return saveSuccess ? STATUS_CODES.successful : STATUS_CODES.InternalServerError;
  }

  async removeMemberFromGroup(bannedMemberUsername: string, adminUsername: string, groupId: string) {
    const admin = await this.usersService.findOneByUsernameWithGroup(adminUsername);
    const group = admin.group;

    // If the admin don't have a group
    if (!group) {
      throw new NotFoundException('Admins must create a group before attempting to remove members');
    }

    // If the admins group and the requested group ID don't match deny access
    if (group.id !== groupId) {
      throw new UnauthorizedException('current user is not admin for the requested group');
    }

    const bannedMember = await this.usersService.findOneByUsernameWithGroup(bannedMemberUsername);

    if (!bannedMember) {
      throw new NotFoundException('Invalid member username');
    }

    if (bannedMember.role === 'Admin') {
      throw new ConflictException('Admins can not leave there own group');
    }

    // Check if the user is a member of the provided group
    if (!bannedMember.group || bannedMember.group.id != group.id) {
      throw new BadRequestException(`User '${bannedMember.username}' is not a member of your group`);
    }

    // Remove the user's group association
    bannedMember.group = null;
    const saveSuccess = await this.usersService.updateUser(bannedMember);

    return saveSuccess ? STATUS_CODES.successful : STATUS_CODES.InternalServerError;
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
}
