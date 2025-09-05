import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../utilis/entities/application.entity';
import { Job } from '../utilis/entities/job.entity';
import { TalentEntity as Talent } from '../utilis/entities/talent.entity';
import { BaseService } from '../abs/abs.service';
import { ObjectId } from 'mongodb';
import { AppliedJobDto } from '../utilis/applied-jobs.dto';
import { Role } from '../shared/decorators/roles.enum';
import { UpdateApplicationDto } from '../utilis/update-application.dto';


@Injectable()
export class ApplicationsService extends BaseService<Application> {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,

        @InjectRepository(Talent)
        private readonly talentRepository: Repository<Talent>,

        @InjectRepository(Job)
        private readonly jobRepository: Repository<Job>,
    ) {
        super(applicationRepository);
    }

    // async createApplication(talent: Talent, job: Job): Promise<Application> {
    //     const application = this.applicationRepository.create({ talent, job, status: ApplicationStatus.PENDING });
    //     return await this.applicationRepository.save(application);
    // }

    async inviteTalent(application: Application, interviewDetails: string): Promise<Application> {
        application.status = ApplicationStatus.INTERVIEW_INVITED;
        application.interviewDetails = interviewDetails;
        return await this.applicationRepository.save(application);
    }

    // applications.service.ts
    async addApplication(talentId: string, jobId: string, coverLetter?: string): Promise<Application> {
        // Validate IDs
        if (!ObjectId.isValid(talentId) || !ObjectId.isValid(jobId)) {
            throw new BadRequestException('Invalid ID format');
        }

        // Check for existing application
        const existingApp = await this.applicationRepository.findOne({
            where: {
                talentId: new ObjectId(talentId),
                jobId: new ObjectId(jobId)
            } as any // Temporary type assertion
        });

        if (existingApp) {
            throw new BadRequestException('You have already applied to this job');
        }

        // Create new application
        const application = new Application();
        application.jobId = new ObjectId(jobId);
        application.talentId = new ObjectId(talentId);
        application.coverLetter = coverLetter;
        application.status = ApplicationStatus.PENDING;

        return this.applicationRepository.save(application);
    }




    async getApplicationsByJob(jobId: string): Promise<Application[]> {
        // Validate the job ID format
        if (!ObjectId.isValid(jobId)) {
            throw new BadRequestException('Invalid job ID format');
        }

        try {
            const applications = await this.applicationRepository.find({
                where: {
                    jobId: new ObjectId(jobId)
                },
                order: {
                    createdAt: 'DESC' // Optional: newest applications first
                }
            });

            if (!applications || applications.length === 0) {
                throw new NotFoundException('No applications found for this job');
            }

            return applications;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error('Failed to fetch applications');
        }
    }

    async getApplicationsByTalent(talentId: string): Promise<Application[]> {
        // Validate talent ID format
        if (!ObjectId.isValid(talentId)) {
            throw new BadRequestException('Invalid talent ID format');
        }



        try {
            const applications = await this.applicationRepository.find({
                where: {
                    talentId: new ObjectId(talentId)
                },
                order: {
                    createdAt: 'DESC' // Newest first
                },
                relations: ['job'] // Load related job entity
            });

            if (!applications || applications.length === 0) {
                throw new NotFoundException('No applications found for this talent');
            }

            
        
            return applications;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error('Failed to fetch applications');
        }
    }


    async updateApplication(
        applicationId: string,
        updateData: UpdateApplicationDto,
        userId: string,  // This comes from req.user.id
        userRole: Role
    ): Promise<Application> {
        // Validate application ID
        if (!ObjectId.isValid(applicationId)) {
            throw new BadRequestException('Invalid application ID');
        }

        const application = await this.applicationRepository.findOne({
            where: { _id: new ObjectId(applicationId) }
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Authorization - Talent can only update their own applications
        if (userRole === Role.TALENT) {
            if (application.talentId.toString() !== userId) {
                throw new Error('You can only update your own applications');
            }
        }

        // Employer can only update status/interview details
        if (userRole === Role.EMPLOYER) {
            const { coverLetter, ...employerUpdateData } = updateData;
            if (coverLetter) {
                throw new Error('Employers cannot modify cover letters');
            }
            return this.applicationRepository.save({
                ...application,
                ...employerUpdateData
            });
        }

        // Talent can only update cover letter
        if (userRole === Role.TALENT) {
            const { status, interviewDate, interviewDetails, ...talentUpdateData } = updateData;
            if (status || interviewDate || interviewDetails) {
                throw new Error('You can only update your cover letter');
            }
            return this.applicationRepository.save({
                ...application,
                ...talentUpdateData
            });
        }

        throw new Error('Invalid user role');
    }

}
