import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupService } from 'src/group/group.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from 'src/typeORM/entities/poll';
import { PollOption } from 'src/typeORM/entities/polloption';
import { CreatePollDto } from './dtos/createPollDto.dto';
import { User } from 'src/typeORM/entities/user';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private readonly pollOptionRepository: Repository<PollOption>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly groupService: GroupService,
  ) {}

  async addPoll(createPollDto: CreatePollDto): Promise<Poll> {
    const {
      adminUsername,
      poll: { question, ...options },
    } = createPollDto;
    const optionArray: string[] = Object.values(options);

    // Check if the admin has a group
    const group = await this.groupService.findOneByAdminUsername(adminUsername);
    if (!group) {
      throw new NotFoundException('Admin must have a group to administer. Create a group first.');
    }

    // Create a new poll entity
    const newPoll = this.pollRepository.create({
      question,
      group,
    });

    // Save the new poll
    const savedPoll = await this.pollRepository.save(newPoll);

    // Create poll options and associate them with the poll
    const pollOptions = optionArray.map((optionText: string) =>
      this.pollOptionRepository.create({
        optionText,
        poll: savedPoll,
      }),
    );

    // Save poll options
    await this.pollOptionRepository.save(pollOptions);
    return this.getPollWithOptions(savedPoll.id);
  }
  async removePoll(pollId: string, username: string): Promise<void> {
    // Check if the poll exists
    const pollToRemove = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['options', 'group'],
    });

    if (!pollToRemove) {
      throw new NotFoundException('Poll not found.');
    }

    // Remove poll options first
    await this.pollOptionRepository.remove(pollToRemove.options);

    // Remove the poll itself
    await this.pollRepository.remove(pollToRemove);
  }
  async closePoll(pollId: string): Promise<void> {
    // Check if the poll exists
    const pollToClose = await this.pollRepository.findOne({
      where: { id: pollId },
    });

    if (!pollToClose) {
      throw new NotFoundException('Poll not found.');
    }

    pollToClose.isOpen = false;
    await this.pollRepository.save(pollToClose);
  }
  async voteOnPoll(pollId: string, optionId: string, username: string): Promise<Poll> {
    // Check if the poll exists
    const pollToVote = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['options', 'group'], // Ensure poll options and group are loaded
    });

    if (!pollToVote) {
      throw new NotFoundException('Poll not found.');
    }
    if (!pollToVote.isOpen) {
      throw new BadRequestException('Poll is closed.');
    }

    // Check if the user has already voted on this poll
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['votedPolls', 'group'], // Ensure voted polls and group are loaded
    });
    // Check if the poll belongs to the same group as the user
    if (!user.group || pollToVote.group.id !== user.group.id) {
      throw new BadRequestException("Poll does not belong to the user's group.");
    }
    if (user.votedPolls && user.votedPolls.some((votedPoll) => votedPoll.id == pollId)) {
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
    // Save the updated poll option
    await this.pollRepository.save(pollToVote);

    // Add the poll to the user's voted polls
    user.votedPolls = [...(user.votedPolls || []), pollToVote];

    // Save the updated user
    await this.userRepository.save(user);
    return await this.getPollWithOptions(pollId);
  }

  async getPollWithOptions(pollId: string): Promise<Poll | undefined> {
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['options'], // Load the options relation
    });

    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    return poll;
  }
  async getPollsByGroupId(groupId: number): Promise<Poll[] | undefined> {
    try {
      const polls = await this.pollRepository.createQueryBuilder('poll').leftJoinAndSelect('poll.options', 'options').where('poll.group.id = :groupId', { groupId }).getMany();

      return polls;
    } catch (error) {
      return undefined;
    }
  }
}
