import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger, ConflictException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TalentsService } from '../talents/talents.service';
import { EmployerService } from '../employer/employer.service';
import { TalentEntity, AuthProvider } from '../utilis/entities/talent.entity';
import { Employer as EmployerEntity } from '../utilis/entities/employer.entity';
import { SignupDto } from '../utilis/auth.dto';
import { Role } from '../shared/decorators/roles.enum';
import { OtpService } from './otp.service';
import { HashUtil } from '../shared/utils/hash.util';
import BaseEntity from '../utilis/base.entity';

@Injectable()
export class AuthService<T extends BaseEntity> {
    constructor(
        private readonly jwtService: JwtService,
        private readonly talentService: TalentsService,
        private readonly employerService: EmployerService,
        private readonly otpService: OtpService
    ) { }
    /**
     * @param email - The email of the user
     * @param password - The password of the user (nullable)
     * @param role - The role of the user (talent or employer)
     */
    async signUp(signupDto: SignupDto): Promise<any> {
        const logger = new Logger('AuthService');
        let userCreated = false;
        let userEmail = '';
        
        try {
            const { email, password, role } = signupDto;
            userEmail = email;
            logger.log(`🔍 Starting signup process for ${email} with role ${role}`);
            
            // Production-optimized database timeout
            const dbTimeoutMs = process.env.NODE_ENV === 'production' ? 8000 : 10000;
            
            // Check if user already exists with enhanced error handling
            let existingUser;
            try {
                logger.log(`🔍 Checking if ${role} exists with email: ${email} (timeout: ${dbTimeoutMs}ms)`);
                const startTime = Date.now();
                
                if (role === 'talent') {
                    existingUser = await Promise.race([
                        this.talentService.findByEmail(email),
                        new Promise<null>((_, reject) => 
                            setTimeout(() => {
                                logger.error(`❌ Database lookup timeout after ${dbTimeoutMs}ms for talent: ${email}`);
                                reject(new Error('Database timeout'));
                            }, dbTimeoutMs)
                        )
                    ]);
                } else {
                    existingUser = await Promise.race([
                        this.employerService.findByEmail(email),
                        new Promise<null>((_, reject) => 
                            setTimeout(() => {
                                logger.error(`❌ Database lookup timeout after ${dbTimeoutMs}ms for employer: ${email}`);
                                reject(new Error('Database timeout'));
                            }, dbTimeoutMs)
                        )
                    ]);
                }
                
                const duration = Date.now() - startTime;
                logger.log(`✅ Database lookup completed in ${duration}ms for ${email}`);
                
            } catch (dbError: any) {
                logger.error(`❌ Database error while checking existing user: ${dbError.message}`);
                logger.error(`❌ Database error stack: ${dbError.stack}`);
                
                // Force garbage collection in production if available
                if (process.env.NODE_ENV === 'production' && global.gc) {
                    try {
                        global.gc();
                        logger.log(`🧹 Forced garbage collection after database error`);
                    } catch (gcError) {
                        logger.warn(`⚠️ Garbage collection failed: ${gcError.message}`);
                    }
                }
                
                throw new InternalServerErrorException('Database connection error. Please try again later.');
            }

            // If user exists and is already verified, throw error
            if (existingUser) {
                if (existingUser.isEmailVerified) {
                    throw new ConflictException('User with this email already exists');
                }
                logger.log(`🔄 User exists but not verified, resending OTP to ${email}`);
            } else {
                // Create user with isEmailVerified = false with enhanced error handling
                logger.log(`👤 Creating new ${role} user with email: ${email}`);
                const createTimeoutMs = process.env.NODE_ENV === 'production' ? 12000 : 15000;
                
                try {
                    logger.log(`👤 Starting user creation with ${createTimeoutMs}ms timeout`);
                    const createStartTime = Date.now();
                    
                    if (role === 'talent') {
                        await Promise.race([
                            this.talentService.createTalent(email, password, AuthProvider.EMAIL, Role.TALENT),
                            new Promise<never>((_, reject) => 
                                setTimeout(() => {
                                    logger.error(`❌ User creation timeout after ${createTimeoutMs}ms for talent: ${email}`);
                                    reject(new Error('User creation timeout'));
                                }, createTimeoutMs)
                            )
                        ]);
                    } else {
                        await Promise.race([
                            this.employerService.createEmployer(email, password, Role.EMPLOYER),
                            new Promise<never>((_, reject) => 
                                setTimeout(() => {
                                    logger.error(`❌ User creation timeout after ${createTimeoutMs}ms for employer: ${email}`);
                                    reject(new Error('User creation timeout'));
                                }, createTimeoutMs)
                            )
                        ]);
                    }
                    
                    const createDuration = Date.now() - createStartTime;
                    logger.log(`✅ User created successfully in ${createDuration}ms: ${email}`);
                    userCreated = true;
                    
                    // Force garbage collection after user creation in production
                    if (process.env.NODE_ENV === 'production' && global.gc) {
                        try {
                            global.gc();
                            logger.log(`🧹 Forced garbage collection after user creation`);
                        } catch (gcError) {
                            logger.warn(`⚠️ Garbage collection failed: ${gcError.message}`);
                        }
                    }
                    
                } catch (createError: any) {
                    logger.error(`❌ Failed to create user: ${createError.message}`);
                    logger.error(`❌ Create error stack: ${createError.stack}`);
                    
                    // Force garbage collection on error in production
                    if (process.env.NODE_ENV === 'production' && global.gc) {
                        try {
                            global.gc();
                            logger.log(`🧹 Forced garbage collection after creation error`);
                        } catch (gcError) {
                            logger.warn(`⚠️ Garbage collection failed: ${gcError.message}`);
                        }
                    }
                    
                    throw new InternalServerErrorException('Failed to create user account. Please try again.');
                }
            }

            logger.log(`📧 Attempting to send OTP to ${email} for verification`);
            // Send OTP for email verification with production-optimized timeout
            const otpTimeoutMs = process.env.NODE_ENV === 'production' ? 20000 : 30000;
            
            try {
                logger.log(`📧 Starting OTP send with ${otpTimeoutMs}ms timeout`);
                const otpStartTime = Date.now();
                
                await Promise.race([
                    this.otpService.sendOTP(email, 'signup'),
                    new Promise<never>((_, reject) => 
                        setTimeout(() => {
                            logger.error(`❌ OTP send timeout after ${otpTimeoutMs}ms for ${email}`);
                            reject(new Error('OTP send timeout'));
                        }, otpTimeoutMs)
                    )
                ]);
                
                const otpDuration = Date.now() - otpStartTime;
                logger.log(`✅ OTP sent successfully to ${email} in ${otpDuration}ms`);
                
            } catch (otpError: any) {
                logger.error(`❌ Failed to send OTP: ${otpError.message}`);
                logger.error(`❌ OTP error stack: ${otpError.stack}`);
                
                // Force garbage collection on OTP error in production
                if (process.env.NODE_ENV === 'production' && global.gc) {
                    try {
                        global.gc();
                        logger.log(`🧹 Forced garbage collection after OTP error`);
                    } catch (gcError) {
                        logger.warn(`⚠️ Garbage collection failed: ${gcError.message}`);
                    }
                }
                
                // If user was just created and OTP fails, we should still return success
                // but inform about the OTP issue
                if (userCreated) {
                    logger.warn(`⚠️ User created but OTP failed. User can request resend.`);
                    return {
                        message: 'Account created but verification email failed to send. Please request a new verification code.',
                        email,
                        role,
                        requiresResend: true
                    };
                }
                throw new InternalServerErrorException('Failed to send verification email. Please try again or request a resend.');
            }

            return {
                message: 'OTP sent to your email. Please verify to complete signup.',
                email,
                role
            };
        } catch (error: any) {
            logger.error(`❌ Signup failed for ${userEmail || signupDto.email}:`, error.message);
            logger.error(`❌ Error stack:`, error.stack);
            
            // Enhanced error logging for production debugging
            logger.error(`❌ Error type: ${error.constructor?.name || 'Unknown'}`);
            logger.error(`❌ User created: ${userCreated}`);
            logger.error(`❌ Environment: ${process.env.NODE_ENV}`);
            
            // If error is already a NestJS exception, rethrow it
            if (error instanceof HttpException) {
                throw error;
            }
            
            // Provide more specific error messages based on error type
            if (error.message?.includes('timeout')) {
                throw new InternalServerErrorException('Request timeout. Please try again.');
            }
            if (error.message?.includes('connection')) {
                throw new InternalServerErrorException('Database connection error. Please try again later.');
            }
            if (error.message?.includes('email')) {
                throw new InternalServerErrorException('Email service error. Please try again or contact support.');
            }
            
            // Otherwise, wrap in InternalServerErrorException
            throw new InternalServerErrorException('An unexpected error occurred during signup. Please try again.');
        }
    }
    

    async signIn(email: string, password: string) {
      const logger = new Logger('AuthService');
      
      try {
        logger.log(`🔍 Starting signin process for ${email}`);
        
        // Find user with timeout protection
        let user: any;
        try {
          logger.log(`🔍 Looking up user: ${email}`);
          const talentPromise = this.talentService.findByEmail(email);
          const employerPromise = this.employerService.findByEmail(email);
          
          const [talent, employer] = await Promise.race([
            Promise.all([talentPromise, employerPromise]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('User lookup timeout')), 10000))
          ]);
          
          user = talent || employer;
          logger.log(`🔍 User lookup result: ${user ? 'found' : 'not found'}`);
        } catch (lookupError: any) {
          logger.error(`❌ User lookup failed: ${lookupError.message}`);
          if (lookupError.message?.includes('timeout')) {
            throw new InternalServerErrorException('Database timeout during signin. Please try again.');
          }
          throw new InternalServerErrorException('Database error during signin. Please try again.');
        }
    
        if (!user) {
          logger.log(`❌ No user found for email: ${email}`);
          throw new UnauthorizedException('Invalid credentials');
        }
        
        logger.log(`🔐 Verifying password for user: ${email}`);
        // Use HashUtil for consistent timeout handling
        let isPasswordValid: boolean;
        try {
          logger.log(`🔐 Starting password comparison using HashUtil`);
          const startTime = Date.now();
          
          isPasswordValid = await HashUtil.comparePassword(password, user.password);
          
          const duration = Date.now() - startTime;
          logger.log(`✅ Password comparison completed in ${duration}ms`);
          
        } catch (passwordError: any) {
          logger.error(`❌ Password verification failed: ${passwordError.message}`);
          logger.error(`❌ Password error stack: ${passwordError.stack}`);
          
          // Force garbage collection in production if available
          if (process.env.NODE_ENV === 'production' && global.gc) {
            try {
              global.gc();
              logger.log(`🧹 Forced garbage collection after password error`);
            } catch (gcError) {
              logger.warn(`⚠️ Garbage collection failed: ${gcError.message}`);
            }
          }
          
          throw new InternalServerErrorException('Authentication error. Please try again.');
        }
        
        if (!isPasswordValid) {
          logger.log(`❌ Invalid password for user: ${email}`);
          throw new UnauthorizedException('Invalid credentials');
        }
        
        logger.log(`✅ Password verified for user: ${email}`);
    
        if (!user.isEmailVerified) {
          logger.log(`❌ Email not verified for user: ${email}`);
          throw new UnauthorizedException('Email not verified. Please verify before signing in.');
        }
        
        logger.log(`🎫 Generating token for user: ${email}`);
        // Token generation with timeout
        try {
          const tokenResult = await Promise.race([
            this.generateToken(user),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Token generation timeout')), 5000))
          ]);
          
          logger.log(`✅ Signin successful for user: ${email}`);
          return tokenResult;
        } catch (tokenError: any) {
          logger.error(`❌ Token generation failed: ${tokenError.message}`);
          throw new InternalServerErrorException('Token generation error. Please try again.');
        }
        
      } catch (error: any) {
        logger.error(`❌ Signin failed for ${email}:`, error.message);
        logger.error(`❌ Error type: ${error.constructor?.name || 'Unknown'}`);
        logger.error(`❌ Error stack:`, error.stack);
        
        // If error is already a NestJS exception, rethrow it
        if (error instanceof HttpException) {
          throw error;
        }
        
        // Provide more specific error messages based on error type
        if (error.message?.includes('timeout')) {
          throw new InternalServerErrorException('Request timeout during signin. Please try again.');
        }
        if (error.message?.includes('connection')) {
          throw new InternalServerErrorException('Database connection error. Please try again later.');
        }
        
        // Otherwise, wrap in InternalServerErrorException
        throw new InternalServerErrorException('An unexpected error occurred during signin. Please try again.');
      }
    }

    async verifySignupOTP(email: string, otp: string): Promise<{ message: string }> {
      const logger = new Logger('AuthService');
      
      try {
        logger.log(`🔍 Starting OTP verification for ${email}`);
        
        // Verify OTP with timeout
        try {
          await Promise.race([
            this.otpService.verifyOTP(email, otp),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OTP verification timeout')), 10000))
          ]);
          logger.log(`✅ OTP verified for ${email}`);
        } catch (otpError: any) {
          logger.error(`❌ OTP verification failed: ${otpError.message}`);
          if (otpError instanceof HttpException) {
            throw otpError;
          }
          throw new InternalServerErrorException('OTP verification error. Please try again.');
        }
    
        // Find user with timeout protection
        let user: any;
        try {
          logger.log(`🔍 Looking up user for verification: ${email}`);
          const [talent, employer] = await Promise.race([
            Promise.all([
              this.talentService.findByEmail(email),
              this.employerService.findByEmail(email)
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('User lookup timeout')), 10000))
          ]);
          
          user = talent || employer;
        } catch (lookupError: any) {
          logger.error(`❌ User lookup failed during verification: ${lookupError.message}`);
          throw new InternalServerErrorException('Database error during verification. Please try again.');
        }
    
        if (!user) {
          logger.error(`❌ User not found during verification: ${email}`);
          throw new NotFoundException('User not found');
        }
    
        if (user.isEmailVerified) {
          logger.log(`ℹ️ Email already verified for ${email}`);
          return { message: 'Email is already verified. No further action needed.' };
        }
    
        // Update user verification status with timeout
        try {
          logger.log(`🔄 Updating verification status for ${email}`);
          if (user instanceof TalentEntity) {
            await Promise.race([
              this.talentService.update(user.id, { isEmailVerified: true }),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Update timeout')), 10000))
            ]);
          } else {
            await Promise.race([
              this.employerService.update(user.id, { isEmailVerified: true }),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Update timeout')), 10000))
            ]);
          }
          logger.log(`✅ Email verification completed for ${email}`);
        } catch (updateError: any) {
          logger.error(`❌ Failed to update verification status: ${updateError.message}`);
          throw new InternalServerErrorException('Failed to complete email verification. Please try again.');
        }
    
        return { message: 'Email verified successfully. You can now sign in.' };
        
      } catch (error: any) {
        logger.error(`❌ OTP verification process failed for ${email}:`, error.message);
        logger.error(`❌ Error type: ${error.constructor?.name || 'Unknown'}`);
        logger.error(`❌ Error stack:`, error.stack);
        
        // If error is already a NestJS exception, rethrow it
        if (error instanceof HttpException) {
          throw error;
        }
        
        // Provide more specific error messages based on error type
        if (error.message?.includes('timeout')) {
          throw new InternalServerErrorException('Request timeout during verification. Please try again.');
        }
        
        // Otherwise, wrap in InternalServerErrorException
        throw new InternalServerErrorException('An unexpected error occurred during verification. Please try again.');
      }
    }

    // async googleSignIn(googleUser: any) {
    //     const { email } = googleUser;

    //     let user = await this.talentService.findByEmail(email) || await this.employerService.findByEmail(email);
    //     if (!user) {
    //         user = await this.talentService.createTalent(email, null, AuthProvider.GOOGLE, Role.TALENT);
    //     }

    //     return this.generateToken(user);
    // }
   async resendOTP(email: string, purpose: 'signup' | 'signin'): Promise<{ message: string }> {
    const logger = new Logger('AuthService');
    
    try {
      logger.log(`🔄 Resending OTP to ${email} for ${purpose}`);
      
      await Promise.race([
        this.otpService.sendOTP(email, purpose),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OTP resend timeout')), 30000))
      ]);
      
      logger.log(`✅ OTP resent successfully to ${email}`);
      return {
        message: 'New verification code sent to your email'
      };
    } catch (error: any) {
      logger.error(`❌ Failed to resend OTP to ${email}:`, error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.message?.includes('timeout')) {
        throw new InternalServerErrorException('Email service timeout. Please try again.');
      }
      
      throw new InternalServerErrorException('Failed to resend verification code. Please try again.');
    }
  }

async requestPasswordReset(email: string): Promise<{ message: string }> {
  const logger = new Logger('AuthService');
  
  try {
    logger.log(`🔐 Password reset request for ${email}`);
    
    // Find user with timeout protection
    let user: any;
    try {
      const [talent, employer] = await Promise.race([
        Promise.all([
          this.talentService.findByEmail(email),
          this.employerService.findByEmail(email)
        ]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('User lookup timeout')), 10000))
      ]);
      
      user = talent || employer;
    } catch (lookupError: any) {
      logger.error(`❌ User lookup failed for password reset: ${lookupError.message}`);
      throw new InternalServerErrorException('Database error. Please try again.');
    }

    if (!user) {
      logger.log(`❌ No user found for password reset: ${email}`);
      throw new NotFoundException('No user found with this email');
    }

    // Send OTP with timeout protection
    try {
      await Promise.race([
        this.otpService.sendOTP(email, 'reset'),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OTP send timeout')), 30000))
      ]);
      
      logger.log(`✅ Password reset OTP sent to ${email}`);
    } catch (otpError: any) {
      logger.error(`❌ Failed to send password reset OTP: ${otpError.message}`);
      throw new InternalServerErrorException('Failed to send password reset email. Please try again.');
    }

    return { message: 'Password reset OTP sent to your email' };
  } catch (error: any) {
    logger.error(`❌ Password reset request failed for ${email}:`, error.message);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Password reset request failed. Please try again.');
  }
}

async verifyResetOTP(email: string, otp: string): Promise<{ message: string }> {
  const logger = new Logger('AuthService');
  
  try {
    logger.log(`🔍 Verifying reset OTP for ${email}`);
    
    await Promise.race([
      this.otpService.verifyOTP(email, otp),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OTP verification timeout')), 10000))
    ]);
    
    logger.log(`✅ Reset OTP verified for ${email}`);
    return { message: 'OTP verified. You can now reset your password' };
  } catch (error: any) {
    logger.error(`❌ Reset OTP verification failed for ${email}:`, error.message);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    if (error.message?.includes('timeout')) {
      throw new InternalServerErrorException('OTP verification timeout. Please try again.');
    }
    
    throw new InternalServerErrorException('OTP verification failed. Please try again.');
  }
}

async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
  const logger = new Logger('AuthService');
  
  try {
    logger.log(`🔐 Resetting password for ${email}`);
    
    // Find user with timeout protection
    let user: any;
    try {
      const [talent, employer] = await Promise.race([
        Promise.all([
          this.talentService.findByEmail(email),
          this.employerService.findByEmail(email)
        ]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('User lookup timeout')), 10000))
      ]);
      
      user = talent || employer;
    } catch (lookupError: any) {
      logger.error(`❌ User lookup failed for password reset: ${lookupError.message}`);
      throw new InternalServerErrorException('Database error. Please try again.');
    }

    if (!user) {
      logger.error(`❌ User not found for password reset: ${email}`);
      throw new NotFoundException('User not found');
    }

    // Hash password with timeout protection
    let hashedPassword: string;
    try {
      hashedPassword = await Promise.race([
        HashUtil.hashPassword(newPassword),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Password hashing timeout')), 10000))
      ]);
    } catch (hashError: any) {
      logger.error(`❌ Password hashing failed: ${hashError.message}`);
      throw new InternalServerErrorException('Password processing error. Please try again.');
    }

    // Update password with timeout protection
    try {
      if (user instanceof TalentEntity) {
        await Promise.race([
          this.talentService.update(user.id, { password: hashedPassword }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Password update timeout')), 10000))
        ]);
      } else {
        await Promise.race([
          this.employerService.update(user.id, { password: hashedPassword }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Password update timeout')), 10000))
        ]);
      }
      
      logger.log(`✅ Password reset completed for ${email}`);
    } catch (updateError: any) {
      logger.error(`❌ Password update failed: ${updateError.message}`);
      throw new InternalServerErrorException('Failed to update password. Please try again.');
    }

    return { message: 'Password reset successful' };
  } catch (error: any) {
    logger.error(`❌ Password reset failed for ${email}:`, error.message);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Password reset failed. Please try again.');
  }
}
private generateToken(user: TalentEntity | EmployerEntity) {
  const payload = { id: user.id, email: user.email, role: user instanceof TalentEntity ? 'talent' : 'employer' };
  const accessToken = this.jwtService.sign(payload);
  return { accessToken, user };
}
}
