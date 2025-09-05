import { Module } from '@nestjs/common';
import { EmployerService } from './employer.service';
import { EmployerController } from './employer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employer as EmployerEntity } from '../utilis/entities/employer.entity';
import { AwsService } from '../aws/aws.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployerEntity])],
  providers: [EmployerService, AwsService],
  controllers: [EmployerController],
  exports: [EmployerService]
})
export class EmployerModule {}
