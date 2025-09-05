import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/db.module';
import { TalentsModule } from './talents/talents.module';
import { AwsModule } from './aws/aws.module';
import { AuthModule } from './auth/auth.module';
import { EmployerModule } from './employer/employer.module';
import { ApplicationsModule } from './applications/applications.module';
import { JobsModule } from './jobs/jobs.module';
import * as Joi from 'joi';


@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        APP_PORT: Joi.number().port().default(4001),
        DB_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
        JWT_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(24).required(),
          otherwise: Joi.string().min(10).optional(),
        }),
        EMAIL_FROM: Joi.alternatives().conditional('NODE_ENV', {
          is: 'production',
          then: Joi.string().email().required(),
          otherwise: Joi.string().email().allow('').optional(),
        }),
        RE_SEND_PASS: Joi.alternatives().conditional('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(10).required(),
          otherwise: Joi.string().allow('').optional(),
        }),
        SMTP_HOST: Joi.string().empty('').optional(),
        SMTP_PORT: Joi.number().optional(),
        SMTP_USER: Joi.string().empty('').optional(),
        SMTP_PASS: Joi.string().empty('').optional(),
        GOOGLE_CLIENT_ID: Joi.string().empty('').optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().empty('').optional(),
        ALLOWED_ORIGINS: Joi.string().empty('').optional(),
        UV_THREADPOOL_SIZE: Joi.number().optional(),
        NODE_OPTIONS: Joi.string().empty('').optional(),
      }),
    }),
    TalentsModule,
    AwsModule,
    AuthModule,
    EmployerModule,
    ApplicationsModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }