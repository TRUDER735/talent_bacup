import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
  OnModuleDestroy,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

interface OtpData {
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService implements OnModuleDestroy {
  private readonly logger = new Logger(OtpService.name);
  private otpStorage: Map<string, OtpData> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;
  private isEmailConfigured = false;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.initializeEmailTransporter().catch(error => {
      this.logger.error('Failed to initialize email transporter in constructor:', error);
    });

    // Periodic cleanup to prevent memory growth in long-running containers
    this.cleanupInterval = setInterval(() => {
      try {
        const now = new Date();
        let purged = 0;
        for (const [email, data] of this.otpStorage.entries()) {
          if (now > data.expiresAt) {
            this.otpStorage.delete(email);
            purged++;
          }
        }
        if (purged > 0) {
          this.logger.log(`🧹 Purged ${purged} expired OTP entr${purged === 1 ? 'y' : 'ies'}`);
        }
      } catch (err: any) {
        this.logger.error('Cleanup interval error:', err?.message || String(err));
      }
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private async initializeEmailTransporter() {
    try {
      const resendApiKey = this.configService.get<string>('RE_SEND_PASS');
      const emailFrom = this.configService.get<string>('EMAIL_FROM');

      this.logger.log('🔧 Initializing email service...');
      this.logger.log(`RE_SEND_PASS: ${resendApiKey ? '✅ set' : '❌ missing'} (length: ${resendApiKey?.length || 0})`);
      this.logger.log(`EMAIL_FROM: ${emailFrom ? '✅ set' : '❌ missing'} (${emailFrom || 'undefined'})`);

      if (!resendApiKey || !emailFrom) {
        this.logger.error('❌ Email configuration incomplete - email sending will be disabled');
        this.logger.error(`Missing: ${[
          !resendApiKey && 'RE_SEND_PASS (Resend API Key)',
          !emailFrom && 'EMAIL_FROM'
        ].filter(Boolean).join(', ')}`);
        this.isEmailConfigured = false;
        return;
      }

      // Test Resend API connection
      this.logger.log('🔧 Testing Resend API connection...');
      const testResponse = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        throw new Error(`Resend API test failed: ${testResponse.status} ${testResponse.statusText}`);
      }

      this.isEmailConfigured = true;
      this.logger.log('✅ Email service initialized successfully with Resend HTTP API');
    } catch (error) {
      this.logger.error('❌ Failed to initialize email service:', error.message);
      this.isEmailConfigured = false;
    }
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendOTP(
    email: string,
    purpose: 'signup' | 'signin' | 'reset' = 'signup',
  ): Promise<void> {
    this.logger.log(`📧 Sending OTP to ${email} for ${purpose}`);
    this.logger.log(`🔍 Email configured status: ${this.isEmailConfigured}`);
    
    // Enhanced email configuration check with retry
    if (!this.isEmailConfigured) {
      this.logger.error('❌ Email not configured - attempting re-initialization...');
      try {
        await Promise.race([
          this.initializeEmailTransporter(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Email init timeout')), 8000))
        ]);
      } catch (initError: any) {
        this.logger.error(`❌ Email re-initialization failed: ${initError.message}`);
      }

      if (!this.isEmailConfigured) {
        // Do NOT fail signup: generate and store OTP, let client proceed to manual verification or retry send later
        const otp = this.generateOTP();
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
        this.otpStorage.set(email, { email, otp, expiresAt, attempts: 0 });
        const isProd = (this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV) === 'production';
        if (!isProd) {
          this.logger.warn(`⚠️ OTP generated but email not sent: ${otp} for ${email}`);
        } else {
          this.logger.warn(`⚠️ OTP generated but email not sent for ${email}`);
        }
        // Return early without throwing to avoid breaking container/user flow
        return;
      }
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(
      Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    const isProd = (this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV) === 'production';
    if (!isProd) {
      this.logger.log(`🔑 Generated OTP: ${otp} (expires at: ${expiresAt.toISOString()})`);
    } else {
      this.logger.log(`🔑 Generated OTP (expires at: ${expiresAt.toISOString()})`);
    }

    // Store OTP before attempting to send email
    this.otpStorage.set(email, {
      email,
      otp,
      expiresAt,
      attempts: 0,
    });

    try {
      this.logger.log(`📤 Attempting to send OTP email to ${email}...`);
      await Promise.race([
        this.sendOtpEmail(email, otp, purpose),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email send timeout')), process.env.NODE_ENV === 'production' ? 12000 : 30000))
      ]);
      this.logger.log(`✅ OTP sent successfully to ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP to ${email}:`, error.message);
      this.logger.error(`❌ Error type: ${error.constructor?.name || 'Unknown'}`);
      this.logger.error(`❌ Error stack:`, error.stack);
      
      // Enhanced error handling - don't remove OTP immediately
      // This allows for manual verification if needed
      if (!((this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV) === 'production')) {
        this.logger.warn(`⚠️ OTP stored but email failed: ${otp} for ${email}`);
      } else {
        this.logger.warn(`⚠️ OTP stored but email failed for ${email}`);
      }
      
      // Provide more specific error messages
      // Do NOT throw: OTP is already stored. Log and allow client to proceed (manual verification or retry send later)
      if (error.message?.includes('timeout')) {
        this.logger.warn('Email service timeout. OTP stored; client can verify using the code.');
        return;
      }
      if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
        this.logger.warn('Email service authentication failed. OTP stored; client can verify using the code.');
        return;
      }
      if (error.message?.includes('rate limit')) {
        this.logger.warn('Email rate limit exceeded. OTP stored; client can verify using the code later.');
        return;
      }
      this.logger.warn('Failed to send verification email. OTP stored; client can verify using the code.');
      return;
    }
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const otpData = this.otpStorage.get(email);

    if (!otpData) {
      throw new BadRequestException('No OTP found for this email');
    }

    if (new Date() > otpData.expiresAt) {
      this.otpStorage.delete(email);
      throw new BadRequestException('OTP has expired');
    }

    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStorage.delete(email);
      throw new BadRequestException('Too many failed attempts');
    }

    if (otpData.otp !== otp) {
      otpData.attempts++;
      throw new UnauthorizedException('Invalid OTP');
    }

    this.otpStorage.delete(email);
    return true;
  }

  private async sendOtpEmail(
    to: string,
    otpCode: string,
    purpose: 'signup' | 'signin' | 'reset',
  ) {
    const subject = {
      signup: 'Verify Your Email - Sign Up',
      signin: 'Verify Your Email - Sign In',
      reset: 'Reset Your Password',
    }[purpose];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otpCode}</h1>
        </div>
        <p>This code will expire in ${this.OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const emailData = {
      from: this.configService.get<string>('EMAIL_FROM', 'no-reply@uncommon.org'),
      to: [to],
      subject,
      html,
    };

    this.logger.log(`Attempting to send email to ${to} with subject: ${subject}`);
    
    // Retry logic for HTTP requests
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`📤 Email attempt ${attempt}/${maxRetries} to ${to} via Resend API`);
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.configService.get<string>('RE_SEND_PASS')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        this.logger.log(`✅ Email sent successfully on attempt ${attempt}: ${result.id}`);
        return;
      } catch (error: any) {
        lastError = error;
        this.logger.error(`❌ Email attempt ${attempt}/${maxRetries} failed for ${to}: ${error.message}`);
        
        if (attempt < maxRetries) {
          this.logger.log(`🔄 Retrying email send in 2 seconds... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        this.logger.error('Full error details:', error);
        break;
      }
    }
    
    throw lastError; // Re-throw the last error to be caught by sendOTP method
  }
}

