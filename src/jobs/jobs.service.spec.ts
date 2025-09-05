import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from '../utilis/entities/job.entity';
import { ApplicationsService } from '../applications/applications.service';

describe('JobsService', () => {
  let service: JobsService;

  const mockJobRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockApplicationsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: ApplicationsService,
          useValue: mockApplicationsService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJob', () => {
    it('should create a job successfully', async () => {
      const employerId = 'employer1';
      const jobData = { title: 'Test Job', description: 'Job description', location: 'Remote' };
      const expectedJob = { id: '1', ...jobData, employerId };

      mockJobRepository.create.mockReturnValue(expectedJob);
      mockJobRepository.save.mockResolvedValue(expectedJob);

      const result = await service.createJob(employerId, jobData);

      expect(result).toEqual(expectedJob);
      expect(mockJobRepository.create).toHaveBeenCalledWith({ ...jobData, employerId });
      expect(mockJobRepository.save).toHaveBeenCalledWith(expectedJob);
    });
  });
});
