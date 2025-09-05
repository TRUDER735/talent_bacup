import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application as ApplicationEntity } from '../utilis/entities/application.entity';
import { TalentEntity } from '../utilis/entities/talent.entity';
import { Job } from '../utilis/entities/job.entity';

@Module({
  imports: [ TypeOrmModule.forFeature([ApplicationEntity, TalentEntity, Job])],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
  exports: [ApplicationsService]
})
export class ApplicationsModule {}
