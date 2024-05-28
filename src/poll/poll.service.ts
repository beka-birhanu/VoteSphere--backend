import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GroupService } from 'src/group/group.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from 'src/typeORM/entities/poll';
import { PollOption } from 'src/typeORM/entities/pollOption';
import { AddPollDto } from './dtos/addPollDto.dto';
import { STATUS_CODES } from 'http';
import { UsersService } from 'src/users/users.service';
import { VoteService } from 'src/vote/vote.service';
import { User } from 'src/typeORM/entities/user';
import { Vote } from 'src/typeORM/entities/vote';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private readonly pollOptionRepository: Repository<PollOption>,
    private readonly voteService: VoteService,
    private readonly groupService: GroupService,
    private readonly usersService: UsersService,
  ) {}

  async addPoll(addPollDto: AddPollDto, adminUsername: string): Promise<Poll> {
    const loadGroup = true;
    const loadPollOptions = true;
    const {
      groupID,
      poll: { question, options },
    } = addPollDto;

    const group = await this.groupService.findOneByAdminUsername(adminUsername);
    if (!group) {
      throw new NotFoundException('Admin must have a group to administer. Create a group first.');
    }

    if (group.id !== groupID) {
      throw new UnauthorizedException('User lacks necessary permissions');
    }

    const newPoll = this.pollRepository.create({ question, group });
    const savedPoll = await this.pollRepository.save(newPoll);

    const pollOptions = options.map((optionText: string) =>
      this.pollOptionRepository.create({
        optionText,
        poll: savedPoll,
      }),
    );
    await this.pollOptionRepository.save(pollOptions);
    newPoll.options = pollOptions;

    return this.findOne(newPoll.id, !loadGroup, loadPollOptions);
  }

  async removePoll(pollId: string, adminUsername: string): Promise<string> {
    const loadGroup = true;
    const loadPollOptions = true;
    const adminUser = await this.usersService.findOneByUsername(adminUsername, loadGroup);
    const pollToRemove = await this.findOne(pollId, loadGroup, loadPollOptions);

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

    await this.pollRepository.delete(pollId);

    return STATUS_CODES.success;
  }

  async closePoll(pollId: string, adminUsername: string): Promise<Poll> {
    const loadGroup = true;
    const loadPollOptions = true;
    const adminUser = await this.usersService.findOneByUsername(adminUsername, loadGroup);
    const pollToClose = await this.findOne(pollId, loadGroup, loadPollOptions);

    if (!pollToClose) {
      throw new NotFoundException('Poll not found.');
    }

    if (adminUser.group.id !== pollToClose.group.id) {
      throw new UnauthorizedException('User lacks necessary permissions: The poll does not belong to their group');
    }

    pollToClose.isOpen = false;

    return this.pollRepository.save(pollToClose);
  }

  async castVote(pollId: string, optionId: string, username: string): Promise<Poll> {
    const loadGroup = true;
    const loadPollOptions = true;
    const pollToVote = await this.findOne(pollId, loadGroup, loadPollOptions);

    if (!pollToVote) {
      throw new NotFoundException('Poll not found.');
    }

    if (!pollToVote.isOpen) {
      throw new BadRequestException('Poll is closed.');
    }

    const user = await this.usersService.findOneByUsername(username, loadGroup);
    if (!user.group || pollToVote.group.id !== user.group.id) {
      throw new BadRequestException("Poll does not belong to the user's group.");
    }

    const hasVotedOn = await this.voteService.findOneByUserAndPoll(pollToVote, user);
    if (hasVotedOn) {
      throw new BadRequestException('User has already voted on this poll.');
    }

    const selectedOption = pollToVote.options.find((option) => option.id == optionId);
    if (!selectedOption) {
      throw new NotFoundException('Poll option not found.');
    }

    selectedOption.numberOfVotes++;
    await this.pollOptionRepository.save(selectedOption);
    await this.voteService.addVote(pollToVote, user, selectedOption);

    return this.findOne(pollId, false, true);
  }

  async findOne(id: string, withGroup: boolean, withOptions: boolean): Promise<Poll> {
    const relations = [];

    if (withGroup) {
      relations.push('group');
    }

    if (withOptions) {
      relations.push('options');
    }

    return this.pollRepository.findOne({ where: { id: id }, relations: relations });
  }

  private async addVotedInfo(poll: Poll, user: User): Promise<Poll | { hasVoted: boolean; chosenOptionId: string }> {
    const voteInfo: Vote = await this.voteService.findOneByUserAndPoll(poll, user);

    if (voteInfo) {
      return { ...poll, hasVoted: true, chosenOptionId: voteInfo.pollOption.id };
    }
    return { ...poll, hasVoted: false, chosenOptionId: null };
  }

  async getPollsByGroupIdForUser(groupId: string, username: string): Promise<(Poll | { hasVoted: boolean; chosenOptionId: string })[]> {
    const loadGroup = true;
    const polls = await this.pollRepository
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.options', 'options')
      .where('poll.group.id = :groupId', { groupId })
      .getMany();

    const user = await this.usersService.findOneByUsername(username, !loadGroup);

    return Promise.all(polls.map((poll) => this.addVotedInfo(poll, user)));
  }
}
