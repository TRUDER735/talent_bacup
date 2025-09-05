import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job as JobEntity } from '../utilis/entities/job.entity';
import { ApplicationsModule } from '../applications/applications.module';  
import { Employer } from '../utilis/entities/employer.entity';
import { EmployerModule } from '../employer/employer.module';

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity, Employer]), ApplicationsModule, EmployerModule,],  
  providers: [JobsService],
  controllers: [JobsController],
})
export class JobsModule { }
