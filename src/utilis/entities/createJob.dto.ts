import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsDateString, IsMongoId, IsObject } from 'class-validator';
import { ObjectId } from 'mongodb';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

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

  @IsString()
  location: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsDateString()
  expiringDate?: Date;

  @IsOptional()
  status?: boolean;

  @IsOptional()
  remote?: boolean;

  @IsOptional()
  applicationDeadline?: Date;


}


// export class CreateJobDto {
//   @IsString()
//   title: string;

//   @IsString()
//   description: string;

//   @IsOptional()
//   @IsString()
//   requirements?: string;

//   @IsString()
//   location: string;

//   @IsOptional()
//   @IsNumber()
//   salary?: number;

//   @IsOptional()
//   @IsDateString()
//   expiringDate?: Date;

//   @IsOptional()
//   status?: boolean;

//   @IsObject()
//   employerId: ObjectId; 
// }
