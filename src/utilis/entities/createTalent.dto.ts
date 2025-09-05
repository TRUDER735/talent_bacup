import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { AuthProvider } from './talent.entity';
import { Role } from '../../shared/decorators/roles.enum';


export class CreateTalentDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsString()
    authProvider: AuthProvider;

    @IsEnum(Role)
    role: Role;
}
