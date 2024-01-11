import { Module } from '@nestjs/common';
import { Group } from 'src/typeORM/entities/group';
import { User } from 'src/typeORM/entities/user';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { UsersModule } from 'src/users/users.module';
import { GroupModule } from 'src/group/group.module';
import { UsersService } from 'src/users/users.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group]),
    UsersModule,
    GroupModule,
    AuthModule,
  ],
  providers: [MembershipService, UsersService],
  exports: [MembershipService],
  controllers: [MembershipController],
})
export class MembershipModule {}
