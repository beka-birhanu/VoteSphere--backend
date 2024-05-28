import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poll } from 'src/typeORM/entities/poll';
import { PollOption } from 'src/typeORM/entities/pollOption';
import { User } from 'src/typeORM/entities/user';
import { VoteService } from './vote.service';
import { Vote } from 'src/typeORM/entities/vote';

@Module({ imports: [TypeOrmModule.forFeature([User, Poll, PollOption, Vote])], providers: [VoteService], exports: [VoteService] })
export class VoteModule {}
