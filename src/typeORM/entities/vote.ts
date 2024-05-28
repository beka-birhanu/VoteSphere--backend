import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user';
import { Poll } from './poll';
import { PollOption } from './polloption';

@Entity({ name: 'votes' })
@Unique(['user', 'poll'])
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.votes, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Poll, (poll) => poll.votes, { onDelete: 'CASCADE' })
  poll: Poll;

  @ManyToOne(() => PollOption, (pollOption) => pollOption.votes, { onDelete: 'CASCADE', eager: true })
  pollOption: PollOption;
}
