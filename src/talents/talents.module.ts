import { Module } from '@nestjs/common';
import { TalentsController } from './talents.controller';
import { TalentsService } from './talents.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TalentEntity } from '../utilis/entities/talent.entity';
import { AwsService } from '../aws/aws.service';

@Module({
  imports: [ TypeOrmModule.forFeature([TalentEntity])],
  controllers: [TalentsController],
  providers: [TalentsService, AwsService],
  exports: [TalentsService],
})
export class TalentsModule {}
