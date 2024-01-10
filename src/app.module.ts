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

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GroupModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database/database.sqlite',
      entities: [User, Group, PollOption, Poll],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
