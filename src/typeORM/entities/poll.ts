import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PollOption } from './polloption';
import { Group } from './group';

@Entity({ name: 'polls' })
export class Poll {
  @PrimaryGeneratedColumn('uuid', { name: 'poll_id' })
  id: string;

  @Column({ nullable: false })
  question: string;

  @Column({ default: true })
  isOpen: boolean;

  @OneToMany(() => PollOption, (pollOption) => pollOption.poll)
  options: PollOption[];

  @ManyToOne(() => Group, (group) => group.polls, { nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
