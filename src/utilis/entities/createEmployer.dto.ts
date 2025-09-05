import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { AuthProvider } from './employer.entity';
import { Role } from '../../shared/decorators/roles.enum';


export class CreateEmployerDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    password?: string; // Required only for email sign-ups

    @IsString()
    authProvider: AuthProvider;

    @IsEnum(Role)
    role: Role;
}
