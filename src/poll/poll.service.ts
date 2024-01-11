import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupService } from 'src/group/group.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from 'src/typeORM/entities/poll';
import { PollOption } from 'src/typeORM/entities/polloption';
import { CreatePollDto } from './dtos/createPollDto.dto';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private readonly pollOptionRepository: Repository<PollOption>,
    private readonly groupService: GroupService,
  ) {}

  async addPoll(createPollDto: CreatePollDto): Promise<void> {
    const {
      adminUsername,
      poll: { question, ...options },
    } = createPollDto;
    const optionArray: string[] = Object.values(options);

    // Check if the admin has a group
    const group = await this.groupService.findByAdminUsername(adminUsername);
    if (!group) {
      throw new NotFoundException(
        'Admin must have a group to administer. Create a group first.',
      );
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
  }

  // Add other service methods as needed
}
