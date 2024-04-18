import { AfterUpdate, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryColumn } from 'typeorm';
import { Group } from './group';
import { Poll } from './poll';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn()
  username: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  role: string;

  @Column({ name: 'token_blacklist', type: 'simple-array', nullable: true })
  tokenBlackList: string[];

  @ManyToOne(() => Group, (group) => group.users, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToMany(() => Poll, { nullable: true, cascade: true })
  @JoinTable({ name: 'user_voted_polls' })
  votedPolls: Poll[];
}
