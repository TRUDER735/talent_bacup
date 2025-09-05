
import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { ApplicationStatus } from './entities/application.entity';

export class UpdateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsDateString()
  interviewDate?: Date;

  @IsOptional()
  @IsString()
  interviewDetails?: string;
}