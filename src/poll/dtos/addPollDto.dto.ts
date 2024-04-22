import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { PollDto } from './pollDto.dto';

export class AddPollDto {
  @IsNotEmpty({ message: 'Admins username is required' })
  @IsString({ message: 'username must be a string' })
  adminUsername: string;

  @IsObject()
  poll: PollDto;
}
