import { Controller, Post, Get, Param, Body, Request, UseGuards, HttpCode, HttpStatus, Query, Put } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { BaseController } from '../abs/abs.controller';
import { Job } from '../utilis/entities/job.entity';
import { CreateJobDto } from '../utilis/entities/createJob.dto';
import { UpdateJobDto } from '../utilis/entities/updateJob.dto';
import { Roles } from '../shared/decorators/roles.decorator';
import { Role } from '../shared/decorators/roles.enum';
import { RolesGuard } from '../shared/guards/roles.guard';
import { FilterJobsDto } from '../utilis/filter-jobs.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Controller('jobs')
export class JobsController extends BaseController<Job> {
    constructor(private readonly jobsService: JobsService,
        @InjectRepository(Job)
            private readonly jobRepository: Repository<Job>,
    ) {
        super(jobsService);
    }

    // @UseGuards(JwtAuthGuard)
    // @Post(':jobId/apply')
    // async applyForJob(@Request() req, @Param('jobId') jobId: string) {
    //     return await this.jobsService.applyForJob(req.user, jobId);
    // }

    // @UseGuards(JwtAuthGuard)
    // @Get(':jobId/applicants')
    // async viewApplicants(@Request() req, @Param('jobId') jobId: string) {
    //     return await this.jobsService.viewApplicants(req.user, jobId);
    // }

    // @UseGuards(JwtAuthGuard)
    // @Post(':jobId/invite/:talentId')
    // async inviteToInterview(
    //     @Request() req,
    //     @Param('jobId') jobId: string,
    //     @Param('talentId') talentId: string,
    //     @Body('interviewDetails') interviewDetails: string
    // ) {
    //     return await this.jobsService.inviteToInterview(req.user, jobId, talentId, interviewDetails);
    // }

     @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  async create(@Body() createJobDto: CreateJobDto, @Request() req) {
    return this.jobsService.createJob(req.user.id, createJobDto);
  }

 @Get("job/:id")
 async getJobById(@Param('id') id: string): Promise<Job> {
    return this.jobsService.getJobById(id);
    }

     @Get('filter')
        async filterJobs(
            @Query() filterDto: FilterJobsDto
        ): Promise<Job[]> {
            return this.jobsService.filterJobs(filterDto);
        }

    @Post('employers/:employerId/jobs')
    @HttpCode(HttpStatus.CREATED)
    async createJob(
        @Param('employerId') employerId: string,
        @Body() jobData: CreateJobDto
    ): Promise<Job> {
        return this.jobsService.createJob(employerId, jobData);
    }

    @Get(':email/jobs')
    async getEmployerJobs(@Param('email') email: string) {
        return this.jobsService.getJobsByEmployerEmail(email);
    }

    @Get(':employerId')
    async getJobsByEmployerId(@Param('employerId') employerId: string) {
        return this.jobsService.getJobsByEmployerId(employerId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.EMPLOYER)
    async updateJob(
        @Param('id') id: string,
        @Body() updateJobDto: UpdateJobDto,
        @Request() req
    ): Promise<Job> {
        return this.jobsService.updateJob(id, updateJobDto, req.user.id);
    }

}
