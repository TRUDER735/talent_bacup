// dto/create-application.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsNotEmpty()
  jobId: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;
}
