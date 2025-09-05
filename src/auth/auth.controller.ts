
import { Controller, Post, Body, Req, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from '../utilis/auth.dto';
import { Request } from 'express';
import BaseEntity from '../utilis/base.entity';
import { GoogleAuthGuard } from '../shared/guards/google-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';


class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

class ResendOtpDto {
  email: string;
  purpose: 'signup' | 'signin';
}
class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class VerifyResetOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    
    constructor(private readonly authService: AuthService<BaseEntity>) { }

    @Post('signup')
    async signUp(@Body() signupDto: SignupDto) {
        this.logger.log(`Signup attempt for email: ${signupDto.email}, role: ${signupDto.role}`);
        try {
            const result = await this.authService.signUp(signupDto);
            this.logger.log(`Signup successful for email: ${signupDto.email}`);
            return result;
        } catch (error) {
            this.logger.error(`Signup failed for email: ${signupDto.email}`, error.stack);
            throw error;
        }
    }

    @Post('signin')
    async signIn(@Body() body: { email: string; password: string }) {
        this.logger.log(`Signin attempt for email: ${body.email}`);
        try {
            const result = await this.authService.signIn(body.email, body.password);
            this.logger.log(`Signin successful for email: ${body.email}`);
            return result;
        } catch (error) {
            this.logger.error(`Signin failed for email: ${body.email}`, error.stack);
            throw error;
        }
    }
    @Post('verify-email')
    async verifyEmail(@Body() body: VerifyEmailDto) {
      return this.authService.verifySignupOTP(body.email, body.otp);
    }

    @Post('resend-otp')
    async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
      return this.authService.resendOTP(resendOtpDto.email, resendOtpDto.purpose);
    }

    // @Post('google')
    // @UseGuards(GoogleAuthGuard)
    // async googleSignIn(@Req() req: Request) {
    //     return this.authService.googleSignIn(req.user);
    // }


    @Post('forgot-password')
    async forgotPassword(@Body() body: ForgotPasswordDto) {
      return this.authService.requestPasswordReset(body.email);
    }

    @Post('verify-reset-otp')
    async verifyResetOtp(@Body() body: VerifyResetOtpDto) {
      return this.authService.verifyResetOTP(body.email, body.otp);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordDto) {
      return this.authService.resetPassword(body.email, body.newPassword);
    }
}
