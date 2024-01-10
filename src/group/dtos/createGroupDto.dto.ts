import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty({ message: 'Admins username is required' })
  @IsString({ message: 'username must be a string' })
  adminUsername: string;

  @IsNotEmpty({ message: 'Group name cannot be empty' })
  @IsString({ message: 'Group name must be a string' })
  groupName: string;
}
