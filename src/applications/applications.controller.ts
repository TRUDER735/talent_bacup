import { Controller, Post, Body, Param, Request, UseGuards, NotFoundException, BadRequestException, Get, Put } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { BaseController } from '../abs/abs.controller';
import { Application } from '../utilis/entities/application.entity';
import { Roles } from '../shared/decorators/roles.decorator';
import { Role } from '../shared/decorators/roles.enum';
import { RolesGuard } from '../shared/guards/roles.guard';
import { UpdateApplicationDto } from '../utilis/update-application.dto';

@Controller('applications')
export class ApplicationsController extends BaseController<Application> {
    constructor(private readonly applicationsService: ApplicationsService) {
        super(applicationsService)
    }

    // @UseGuards(JwtAuthGuard)
    // @Post(':applicationId/invite')
    // async inviteTalent(
    //     @Request() req,
    //     @Param('applicationId') applicationId: string,
    //     @Body('interviewDetails') interviewDetails: string
    // ) {
    //     const application = await this.applicationsService.findOne({ where: { id: new ObjectId(applicationId) } });

    //     if (!application) {
    //         throw new NotFoundException('Application not found');
    //     }

    //     return await this.applicationsService.inviteTalent(application, interviewDetails);
    // }

    @Post('apply/:jobId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.TALENT)
    async applyToJob(
        @Param('jobId') jobId: string,
        @Request() req,
        @Body('coverLetter') coverLetter?: string,
    ) {
        const talentId = req.user?.id;

        if (!talentId) {
            throw new BadRequestException('Invalid talent');
        }

        return await this.applicationsService.addApplication(talentId, jobId, coverLetter);
    }


    @Get('job/:jobId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.EMPLOYER)
    async getApplicationsByJob(@Param('jobId') jobId: string) {
        return this.applicationsService.getApplicationsByJob(jobId);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.TALENT)
    async getMyApplications(@Request() req) {
        // Uses req.user.id (make sure your JWT contains this)
        return this.applicationsService.getApplicationsByTalent(req.user.id);
    }


    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updateApplication(
        @Param('id') id: string,
        @Body() updateData: UpdateApplicationDto,
        @Request() req
    ) {
        // Use req.user.id instead of req.user.userId
        if (!req.user?.id) {
            throw new Error('Invalid user credentials');
        }

        return this.applicationsService.updateApplication(
            id,
            updateData,
            req.user.id,  // Changed from userId to id
            req.user.role
        );
    }

    //   @Get('job/:jobId')
    // //   @UseGuards(JwtAuthGuard, RolesGuard)
    // //   @Roles(Role.EMPLOYER)
    //   async getJobApplications(@Param('jobId') jobId: string) {
    //     return this.applicationsService.getApplicationsByJob(jobId);
    //   }

}
