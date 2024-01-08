import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Username for refreshing the token',
    example: 'beka_birhanu',
  })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;
}
