import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BaseService } from '../abs/abs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Job, Job as JobEntity } from '../utilis/entities/job.entity';
import { Employer } from '../utilis/entities/employer.entity';
import { ApplicationsService } from '../applications/applications.service';
import {  TalentEntity } from '../utilis/entities/talent.entity';
import { CreateJobDto } from '../utilis/entities/createJob.dto';
import { UpdateJobDto } from '../utilis/entities/updateJob.dto';
import { FilterJobsDto } from '../utilis/filter-jobs.dto';

@Injectable()
export class JobsService extends BaseService<JobEntity> {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    private readonly applicationsService: ApplicationsService,
  ) {
    super(jobRepository);
  }

  // async applyForJob(talent: Talent, jobId: string): Promise<string> {
  //   const job = await this.jobRepository.findOne({ where: { _id: new ObjectId(jobId) } });

  //   if (!job) {
  //     throw new NotFoundException('Job not found');
  //   }

  //   await this.applicationsService.createApplication(talent, job);
  //   return 'Application submitted successfully';
  // }

  // async viewApplicants(employer: Employer, jobId: string) {
  //   const job = await this.jobRepository.findOne({ where: { id: new ObjectId(jobId), employer }, relations: ['applications', 'applications.talent'] });

  //   if (!job) {
  //     throw new NotFoundException('Job not found or unauthorized');
  //   }

  //   return job.applicants.map(app => app.talent);
  // }

  // async inviteToInterview(employer: Employer, jobId: string, talentId: string, interviewDetails: string) {
  //   const job = await this.jobRepository.findOne({ where: { id: new ObjectId(jobId), employer }, relations: ['applications'] });

  //   if (!job) {
  //     throw new NotFoundException('Job not found or unauthorized');
  //   }

  //   const application = job.applicants.find(app => app.talent.id.equals(new ObjectId(talentId)));

  //   if (!application) {
  //     throw new NotFoundException('Talent has not applied for this job');
  //   }

  //   return await this.applicationsService.inviteTalent(application, interviewDetails);
  // }

 async createJob(employerId: string, createJobDto: CreateJobDto): Promise<Job> {
    if (!ObjectId.isValid(employerId)) {
      throw new Error('Invalid employer ID format');
    }

    const job = new Job();
    job.employerId = new ObjectId(employerId);
    job.title = createJobDto.title;
    job.description = createJobDto.description;
    
    job.location = createJobDto.location;
    job.status = createJobDto.status !== undefined ? createJobDto.status : true; // Default to true if not provided
  
 if (createJobDto.requirements) {
      job.requirements = createJobDto.requirements;
    }
    if (createJobDto.salary) {
      job.salary = createJobDto.salary;
    }
    if (createJobDto.applicationDeadline) {
      job.applicationDeadline = new Date(createJobDto.applicationDeadline);
    }

    if (createJobDto.workType) {
      job.workType = createJobDto.workType;
    }
    if (createJobDto.experience) {
      job.experience = createJobDto.experience;
    }
    if( createJobDto.remote !== undefined) {
      job.remote = createJobDto.remote;
    }
    if (createJobDto.requiredSkills) {
      job.requiredSkills = createJobDto.requiredSkills;
    }

    try {
      return await this.jobRepository.save(job);
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }



    return this.jobRepository.save(job);
  }

   async filterJobs(filterDto: FilterJobsDto): Promise<JobEntity[]> {
    let { location, keyword } = filterDto;
  
   
  
    const query: any = {};
  
  
  
    if (location) {
      query.location = new RegExp(`^${location}$`, 'i');
    }
  
    if (keyword?.trim()) {
      const regex = new RegExp(keyword, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { requirements: regex },
        { location: regex },
      ];
    }
  
    return await this.jobRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }
  


  async getJobById(jobId: string): Promise<JobEntity> {
    if (!ObjectId.isValid(jobId)) {
      throw new Error('Invalid job ID format');
    }
    const job = await this.jobRepository.findOne({
      where: { _id: new ObjectId(jobId) },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }


  async getJobsByEmployerId(employerId: string): Promise<JobEntity[]> {
    if (!ObjectId.isValid(employerId)) {
      throw new Error('Invalid employer ID format');
    }

    return this.jobRepository.find({
      where: {
        employerId: new ObjectId(employerId)
      }
    });
  }

  


  async getJobsByEmployerEmail(email: string): Promise<JobEntity[]> {
    const employer = await this.employerRepository.findOne({
      where: { email },
    });

    if (!employer || !employer.jobs || employer.jobs.length === 0) {
      throw new NotFoundException('Employer or jobs not found');
    }

    const jobIds = employer.jobs.map((id) => new ObjectId(id));
    const jobs = await this.jobRepository.find({
      where: {
        _id: {
          $in: jobIds,
        },
      },
    });

    return jobs;
  }

  async updateJob(jobId: string, updateJobDto: UpdateJobDto, employerId: string): Promise<JobEntity> {
    if (!ObjectId.isValid(jobId)) {
      throw new Error('Invalid job ID format');
    }

    if (!ObjectId.isValid(employerId)) {
      throw new Error('Invalid employer ID format');
    }

    // Find the job and verify ownership
    const job = await this.jobRepository.findOne({
      where: {
        _id: new ObjectId(jobId),
        employerId: new ObjectId(employerId)
      }
    });

    if (!job) {
      throw new NotFoundException('Job not found or you do not have permission to update this job');
    }

    // Update the job with the provided data
    Object.assign(job, updateJobDto);

    // Save and return the updated job
    return await this.jobRepository.save(job);
  }

}
