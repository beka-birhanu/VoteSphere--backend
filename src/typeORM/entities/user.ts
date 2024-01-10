import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Group } from './group';

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

  @ManyToOne(() => Group, (group) => group.users, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
