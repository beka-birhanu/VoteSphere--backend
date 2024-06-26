import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user';
import { Poll } from './poll';
import { PollOption } from './pollOption';

@Entity({ name: 'votes' })
@Unique(['user', 'poll'])
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.votes, { cascade: true})
  user: User;

  @ManyToOne(() => Poll, (poll) => poll.votes, { cascade: true})
  poll: Poll;

  @ManyToOne(() => PollOption, (pollOption) => pollOption.votes, { cascade: true, eager: true })
  pollOption: PollOption;
}
