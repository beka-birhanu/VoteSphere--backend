import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupModule } from './group/group.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './typeORM/entities/user';
import { Group } from './typeORM/entities/group';
import { Poll } from './typeORM/entities/poll';
import { PollOption } from './typeORM/entities/polloption';
import { MembershipModule } from './membership/membership.module';
import { PollModule } from './poll/poll.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GroupModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 8000,
      username: 'postgres',
      password: 'cBeYjAqy@8F}gc1H1545~!-test',
      database: 'votesphere',
      autoLoadEntities: true,
      entities: [User, Group, PollOption, Poll],
      synchronize: true,
    }),
    MembershipModule,
    PollModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
