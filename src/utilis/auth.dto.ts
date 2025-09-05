import { IsEmail, IsString, IsOptional, IsEnum, MinLength, Matches } from 'class-validator';

export enum UserRole {
  TALENT = 'talent',
  EMPLOYER = 'employer'
}


export class InitiateAuthDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  otp: string;

  @IsEnum(UserRole)
  role: UserRole;
}


export class CompleteAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  sessionToken: string;
}

export class SigninDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  sessionToken: string;
}


export class SignupDto {
    @IsEmail()
    email: string;
    
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
    password: string;
    
    @IsEnum(UserRole)
    role: 'talent' | 'employer';
}

export class LoginDto {
    email: string;
    password: string;
    role: 'talent' | 'employer';
}
