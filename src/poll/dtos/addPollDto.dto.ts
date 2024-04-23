import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PollDto } from './pollDto.dto';

export class AddPollDto {
  @ApiProperty({ example: 'beka_birhanu', description: 'Admins username' })
  @IsNotEmpty({ message: 'Admins username is required' })
  @IsString({ message: 'Username must be a string' })
  adminUsername: string;

  @ApiProperty({
    example: { question: 'What is your favorite color?', options: ['Red', 'Blue', 'Green'] },
    description: 'Poll object containing question and options',
  })
  @IsNotEmpty({ message: 'Sending a poll is required to add a poll' })
  @ValidateNested()
  @Type(() => PollDto)
  poll: PollDto;

  @ApiProperty({ example: 'group123', description: 'GroupID' })
  @IsNotEmpty({ message: 'GroupID is required' })
  @IsString({ message: 'GroupID must be a string' })
  groupID: string;
}
