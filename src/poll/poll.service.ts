import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GroupService } from 'src/group/group.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from 'src/typeORM/entities/poll';
import { PollOption } from 'src/typeORM/entities/polloption';
import { AddPollDto } from './dtos/addPollDto.dto';
import { STATUS_CODES } from 'http';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private readonly pollOptionRepository: Repository<PollOption>,
    private readonly groupService: GroupService,
    private readonly usersService: UsersService,
  ) {}
  /**
   * Adds a new poll using the provided AddPollDto.
   * @param {AddPollDto} addPollDto - The data required to create the new poll.
   * @returns {Promise<Poll>} A promise that resolves to the newly created poll.
   * @throws {NotFoundException} If the admin does not have a group.
   * @throws {UnauthorizedException} If the user lacks necessary permissions.
   */
  async addPoll(addPollDto: AddPollDto): Promise<Poll> {
    // extract info from addPollDto
    const {
      adminUsername,
      groupID,
      poll: { question, options },
    } = addPollDto;

    // Check if the admin has a group
    const group = await this.groupService.findOneByAdminUsername(adminUsername);
    if (!group) {
      throw new NotFoundException('Admin must have a group to administer. Create a group first.');
    }

    // check if the admin group and the requested group is the same
    if (group.id !== groupID) {
      throw new UnauthorizedException('User lacks necessary permissions');
    }

    // Create a new poll entity
    const newPoll = this.pollRepository.create({ question, group });

    // Save the new poll
    const savedPoll = await this.pollRepository.save(newPoll);

    // Create poll options and associate them with the poll
    const pollOptions = options.map((optionText: string) =>
      this.pollOptionRepository.create({
        optionText,
        poll: savedPoll,
      }),
    );

    // Save poll options
    await this.pollOptionRepository.save(pollOptions);
    newPoll.options = pollOptions;

    return this.findOne(newPoll.id, false, true);
  }

  /**
   * Removes a poll specified by its ID, if allowed.
   * @param {string} pollId - The ID of the poll to remove.
   * @param {string} adminUsername - The username of the admin performing the action.
   * @returns {Promise<string>} A promise resolving to a success message.
   * @throws {NotFoundException} If the poll or admin user is not found.
   * @throws {UnauthorizedException} If the admin does not have necessary permissions.
   * @throws {BadRequestException} If the poll has received votes and cannot be deleted.
   */
  async removePoll(pollId: string, adminUsername: string): Promise<string> {
    const adminUser = await this.usersService.findOneByUsername(adminUsername, true);
    const pollToRemove = await this.findOne(pollId, true, true);

    // Check if the poll exists
    if (!pollToRemove) {
      throw new NotFoundException('Poll not found.');
    }

    if (!adminUser) {
      throw new NotFoundException('Invalid admin username');
    }

    if (adminUser.group.id !== pollToRemove.group.id) {
      throw new UnauthorizedException('User lacks necessary permissions: The poll does not belong to their group');
    }

    let hasBeenVotedOn = false;
    for (const option of pollToRemove.options) {
      if (option.numberOfVotes > 0) {
        hasBeenVotedOn = true;
        break;
      }
    }

    if (hasBeenVotedOn) {
      throw new BadRequestException('If a vote has been cast, the poll cannot be deleted. It can only be closed.');
    }

    // Remove the poll itself
    await this.pollRepository.delete(pollId);

    return STATUS_CODES.success;
  }

  /**
   * Closes a poll specified by its ID.
   * @param {string} pollId - The ID of the poll to close.
   * @param {string} adminUsername - The username of the admin performing the action.
   * @returns {Promise<Poll>} A promise resolving to the closed poll.
   * @throws {NotFoundException} If the poll is not found.
   * @throws {UnauthorizedException} If the admin does not have necessary permissions.
   */
  async closePoll(pollId: string, adminUsername: string): Promise<Poll> {
    // Check if the poll exists
    const adminUser = await this.usersService.findOneByUsername(adminUsername, true);
    const pollToClose = await this.findOne(pollId, true, false);

    // If poll doesn't exist, throw NotFoundException
    if (!pollToClose) {
      throw new NotFoundException('Poll not found.');
    }

    // Check if the admin has necessary permissions
    if (adminUser.group.id !== pollToClose.group.id) {
      throw new UnauthorizedException('User lacks necessary permissions: The poll does not belong to their group');
    }

    // Close the poll by setting isOpen to false
    pollToClose.isOpen = false;

    // Save and return the updated poll
    return this.pollRepository.save(pollToClose);
  }

  async castVote(pollId: string, optionId: string, username: string): Promise<Poll> {
    // Check if the poll exists
    const pollToVote = await this.findOne(pollId, true, true);

    if (!pollToVote) {
      throw new NotFoundException('Poll not found.');
    }

    if (!pollToVote.isOpen) {
      throw new BadRequestException('Poll is closed.');
    }

    // Check if the poll belongs to the same group as the user
    const user = await this.usersService.findOneByUsername(username, true);
    if (!user.group || pollToVote.group.id !== user.group.id) {
      throw new BadRequestException("Poll does not belong to the user's group.");
    }

    // Check if the user has already voted on this poll
    const hasVotedOn = await this.usersService.hasVotedOn(username, pollId);
    if (hasVotedOn) {
      throw new BadRequestException('User has already voted on this poll.');
    }
    // Find the selected poll option
    const selectedOption = pollToVote.options.find((option) => option.id == optionId);

    if (!selectedOption) {
      throw new NotFoundException('Poll option not found.');
    }

    // Increment the vote count for the selected option
    selectedOption.numberOfVotes++;
    await this.pollOptionRepository.save(selectedOption);

    // Add the poll to the user's voted polls
    // Save the updated user
    user.votedPolls = [...(user.votedPolls || []), pollToVote];
    await this.usersService.updateUser(user);

    return this.findOne(pollId, false, true);
  }

  /**
   * Finds a poll by its ID.
   * @param {string} id - The ID of the poll to find.
   * @param {boolean} withGroup - Whether to include the associated group in the result.
   * @param {boolean} withOptions - Whether to include the associated options in the result.
   * @returns {Promise<Poll>} A promise resolving to the found poll.
   */
  async findOne(id: string, withGroup: boolean, withOptions: boolean): Promise<Poll> {
    // Prepare relations based on input flags
    const relations = [];

    if (withGroup) {
      relations.push('group');
    }

    if (withOptions) {
      relations.push('options');
    }

    // Find the poll with specified relations
    return this.pollRepository.findOne({ where: { id: id }, relations: relations });
  }

  /**
   * Retrieves all polls associated with a group specified by its ID.
   * @param {string} groupId - The ID of the group to retrieve polls for.
   * @returns {Promise<Poll[]>} A promise resolving to an array of polls associated with the specified group.
   */
  async getPollsByGroupId(groupId: string): Promise<Poll[]> {
    // Use query builder to retrieve polls with options for the specified group ID
    return this.pollRepository
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.options', 'options') // Left join to also fetch associated options
      .where('poll.group.id = :groupId', { groupId }) // Filter by group ID
      .getMany(); // Execute the query and return the result
  }
}
