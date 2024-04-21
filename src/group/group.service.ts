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

  /**
   * Create a new group with the provided details.
   * @param {CreateGroupDto} createGroupDto - The details of the group to be created.
   * @returns {Promise<GetGroupDto>} - The DTO representing the newly created group.
   * @throws {NotFoundException} - If the admin user does not exist.
   * @throws {ConflictException} - If the admin already has a group.
   * @throws {InternalServerErrorException} - If there is an error during group creation.
   */
  async createGroup(createGroupDto: CreateGroupDto): Promise<GetGroupDto> {
    // Find the admin user based on the provided username
    const adminUser = await this.usersService.findOneByUsername(createGroupDto.adminUsername, true);

    // If admin user doesn't exist, throw NotFoundException
    if (!adminUser) {
      throw new NotFoundException(`User with username ${createGroupDto.adminUsername} not found.`);
    }

    // Check if the admin already has a group, if yes, throw ConflictException
    if (adminUser.group) {
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

  /**
   * Retrieve members of a group identified by the provided group ID.
   * @param {string} groupId - The ID of the group whose members are to be retrieved.
   * @returns {Promise<{ username: string; email: string; is_admin: boolean }[]>} - An array containing details of each member, including username, email, and whether they are an admin (true/false).
   * @throws {NotFoundException} - If the group with the specified ID does not exist.
   */
  async getMembers(groupId: string): Promise<{ username: string; email: string; is_admin: boolean }[]> {
    const group = await this.findOneById(groupId);
    // check the user is member of the group(not implemented)
    if (!group) {
      throw new NotFoundException('Invalid group ID');
    }

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

  /**
   * Add a new member to a group.
   * @param {string} newMemberUsername - The username of the user to be added as a member.
   * @param {string} adminUsername - The username of the admin who is adding the new member.
   * @param {string} groupId - The ID of the group to which the new member is being added.
   * @returns {Promise<boolean>} - A boolean indicating whether the operation was successful.
   * @throws {NotFoundException} - If the admin or new member user does not exist.
   * @throws {ConflictException} - If the admin does not have a group, the admin is not an admin for the specified group, the new member is already an admin, or the new member already belongs to a group.
   */
  async addMemberToGroup(newMemberUsername: string, adminUsername: string, groupId: string): Promise<string> {
    const admin = await this.usersService.findOneByUsername(adminUsername, true);
    const group = admin.group;

    // If the admin don't have a group
    if (!group) {
      throw new NotFoundException('Admins must create a group before attempting to add members');
    }

    // If the admins group and the requested group ID don't match deny access
    if (group.id !== groupId) {
      throw new UnauthorizedException('current user is not admin for the requested group');
    }

    const newMember = await this.usersService.findOneByUsername(newMemberUsername, true);

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

  /**
   * Remove a member from a group.
   * @param {string} bannedMemberUsername - The username of the member to be removed.
   * @param {string} adminUsername - The username of the admin who is removing the member.
   * @param {string} groupId - The ID of the group from which the member is being removed.
   * @returns {Promise<boolean>} - A boolean indicating whether the operation was successful.
   * @throws {NotFoundException} - If the admin or banned member user does not exist.
   * @throws {ConflictException} - If the admin does not have a group, the admin is not an admin for the specified group, the banned member is an admin, or the banned member is not a member of the provided group.
   * @throws {BadRequestException} - If the banned member is not a member of the provided group.
   */
  async removeMemberFromGroup(bannedMemberUsername: string, adminUsername: string, groupId: string): Promise<string> {
    const admin = await this.usersService.findOneByUsername(adminUsername, true);
    const group = admin.group;

    // If the admin don't have a group
    if (!group) {
      throw new NotFoundException('Admins must create a group before attempting to remove members');
    }

    // If the admins group and the requested group ID don't match deny access
    if (group.id !== groupId) {
      throw new UnauthorizedException('current user is not admin for the requested group');
    }

    const bannedMember = await this.usersService.findOneByUsername(bannedMemberUsername, true);

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

  /**
   * Find a group based on the username of its admin.
   * @param {string} adminUsername - The username of the admin associated with the group.
   * @returns {Promise<Group | undefined>} - A Promise resolving to the group entity if found; otherwise, undefined.
   */
  async findOneByAdminUsername(adminUsername: string): Promise<Group | undefined> {
    // Use the groupRepository to find a group by admin username
    return this.groupRepository.findOne({
      where: { admin: { username: adminUsername } }, // Query based on admin username
    });
  }

  /**
   * Find a group by its ID.
   * @param {string} groupId - The ID of the group to find.
   * @returns {Promise<Group | undefined>} - A Promise resolving to the group entity if found; otherwise, undefined.
   */
  async findOneById(groupId: string): Promise<Group | undefined> {
    return this.groupRepository.findOne({
      where: { id: groupId }, // Query based on group ID
    });
  }
}
