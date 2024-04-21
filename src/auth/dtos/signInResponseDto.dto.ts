import { ApiProperty } from '@nestjs/swagger';

export class SignInResponseDto {
  @ApiProperty({ type: String, example: 'beka_birhanu' })
  username: string;

  @ApiProperty({ type: String, example: 'User' })
  role: String;

  @ApiProperty({ type: String, example: 'group1' })
  group_id: string;

  @ApiProperty({ type: String, example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' })
  access_token: string;

  @ApiProperty({ type: String, example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' })
  refresh_token: string;
}
