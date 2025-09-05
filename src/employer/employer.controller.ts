import { Controller, Post, Body, Put, Param, UseInterceptors, UploadedFile, BadRequestException, Get } from '@nestjs/common';
import { EmployerService } from './employer.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Employer as EmployerEntity } from '../utilis/entities/employer.entity';
import { BaseController } from '../abs/abs.controller';
import { Role } from '../shared/decorators/roles.enum';

@Controller('employer')
export class EmployerController extends BaseController<EmployerEntity> {
    constructor(private readonly employerService: EmployerService) {
        super(employerService);
    }

    // @Post('signup')
    // async createEmployer(@Body('email') email: string, @Body('password') password: string | null): Promise<EmployerEntity> {
    //     if (!email || !password) {
    //         throw new BadRequestException('Email and password are required');
    //     }

    //     const role = Role.EMPLOYER; // Default role for employers
    //     return this.employerService.createEmployer(email, password, role);
    // }

    @Get(':email')
    async getEmployerByEmail(@Param('email') email: string): Promise<EmployerEntity | null> {
        return this.employerService.findByEmail(email);
    }

    @Put('profile/:email')
    @UseInterceptors(FileInterceptor('file'))
    async updateProfile(
        @Param('email') email: string,
        @Body() profileData: Partial<EmployerEntity>,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<EmployerEntity> {
        return this.employerService.updateProfile(email, profileData, file);
    }

   @Get('info/:id')
    async findEmployerById(@Param('id') id: string) {
        return this.employerService.getById(id);
    }
}
