import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user';
import { Poll } from './poll';

@Entity({ name: 'groups' })
export class Group {
  @PrimaryGeneratedColumn({ name: 'group_id' })
  id: number;

  @Column({ name: 'group_name', nullable: false })
  groupName: string;

  @OneToMany(() => User, (user) => user.group)
  users: User[];

  @OneToMany(() => Poll, (poll) => poll.group)
  polls: Poll[];

  @OneToOne(() => User)
  @JoinColumn({ name: 'username' })
  admin: User;
}
