import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Poll } from './poll';

@Entity({ name: 'options' })
export class PollOption {
  @PrimaryGeneratedColumn({ name: 'option_id' })
  id: number;

  @Column({ name: 'option_text', nullable: false })
  optionText: string;

  @Column({ name: 'number_of_vote', default: 0 })
  numberOfVotes: number;

  @ManyToOne(() => Poll, (poll) => poll.options, {
    nullable: false,
    cascade: true,
  })
  @JoinColumn({ name: 'poll_id' })
  poll: Poll;
}
