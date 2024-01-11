import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { Group } from 'src/typeORM/entities/group';
import { User } from 'src/typeORM/entities/user';

@Injectable()
export class MembershipService {
  constructor(private readonly usersService: UsersService) {}

  async addMemberToGroup(user: User, group: Group) {
    if (user.group) {
      throw new BadRequestException(
        `User '${user.username}' already belongs to a group.`,
      );
    }

    // Update the user's group
    user.group = group;

    // Save the updated user entity
    return this.usersService.updateUser(user);
  }
  async removeMemberFromGroup(user: User, group: Group) {
    if (user.group.id != group.id) {
      throw new BadRequestException(
        `User '${user.username}' is not a member of your group`,
      );
    }

    // Update the user's group
    user.group = null;

    // Save the updated user entity
    return this.usersService.updateUser(user);
  }
}
