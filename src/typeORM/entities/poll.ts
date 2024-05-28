import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PollOption } from './pollOption';
import { Group } from './group';
import { Vote } from './vote';

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

  @OneToMany(() => Vote, (vote) => vote.poll)
  votes: Vote;

  @ManyToOne(() => Group, (group) => group.polls, { nullable: false, eager: false, cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
