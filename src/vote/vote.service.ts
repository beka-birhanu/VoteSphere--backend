import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Poll } from 'src/typeORM/entities/poll';
import { PollOption } from 'src/typeORM/entities/pollOption';
import { User } from 'src/typeORM/entities/user';
import { Vote } from 'src/typeORM/entities/vote';
import { Repository } from 'typeorm';

const UNIQUE_VIOLATION = '23505';
const ALREADY_VOTED = 0;
const SUCCESS = 1;

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
  ) {}

  async addVote(poll: Poll, user: User, pollOption: PollOption) {
    const newVote = this.voteRepository.create({ user, poll, pollOption });
    try {
      await this.voteRepository.save(newVote);

      return SUCCESS;
    } catch (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return ALREADY_VOTED;
      }
    }
  }

  async findOneByUserAndPoll(poll: Poll, user: User) {
    const username = user.username;
    const pollId = poll.id;

    return this.voteRepository.findOne({ where: { user: { username: username }, poll: { id: pollId } } });
  }
}
