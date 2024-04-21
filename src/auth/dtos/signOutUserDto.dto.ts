import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignOutUserDto {
  @ApiProperty({
    description: 'Username for refreshing the token',
    example: 'beka_birhanu',
  })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;

  @ApiProperty({
    description: 'Refresh token given when signed in',
    example: ';paofEQeppasd0f94134;er0432@sdfuqwe/',
  })
  @IsNotEmpty({ message: 'token cannot be empty' })
  token: string;
}
