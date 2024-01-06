import { INestApplication, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [AuthModule, UsersModule, TeamsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
