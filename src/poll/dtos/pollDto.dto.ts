import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class PollDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9_.]+$/)
  question: string;

  @IsNotEmpty()
  @IsString()
  optionOne: string;

  @IsNotEmpty()
  @IsString()
  optionTwo: string;

  @IsString()
  optionThree: string;

  @IsString()
  optionFour: string;

  @IsString()
  optionFive: string;
}
