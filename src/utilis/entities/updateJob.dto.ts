import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.join(',') : value
  )
  requiredSkills?: string[];

  @IsOptional()
  @IsString()
  workType?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsDateString()
  expiringDate?: Date;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsBoolean()
  remote?: boolean;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: Date;
}
