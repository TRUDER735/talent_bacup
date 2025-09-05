import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
// import { GoogleStrategy } from './strategies/google.strategy';
import { EmployerModule } from '../employer/employer.module';
import { TalentsModule } from '../talents/talents.module';
import { HashUtil } from '../shared/utils/hash.util';
import { OtpService } from './otp.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_secret_key',
      signOptions: { expiresIn: '7d' },
    }),
    TalentsModule,
    EmployerModule,
    
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OtpService, HashUtil],
  exports: [AuthService, OtpService],
})
export class AuthModule { }
