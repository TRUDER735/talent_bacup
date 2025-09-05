import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';

@Module({
  providers: [AwsService],
  controllers: [AwsController],
})
export class AwsModule { }
