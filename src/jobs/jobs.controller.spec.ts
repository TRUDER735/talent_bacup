import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  let jobsService: JobsService;

  const mockJobsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getJobsByEmployer: jest.fn(),
    searchJobs: jest.fn(),
    getJobById: jest.fn(),
    createJob: jest.fn(),
    filterJobs: jest.fn(),
    getJobsByEmployerEmail: jest.fn(),
    getJobsByEmployerId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    jobsService = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getJobById', () => {
    it('should return a job by id', async () => {
      const expectedJob = { id: '1', title: 'Test Job' };
      mockJobsService.getJobById.mockResolvedValue(expectedJob);

      const result = await controller.getJobById('1');

      expect(result).toEqual(expectedJob);
      expect(mockJobsService.getJobById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a job successfully', async () => {
      const createJobDto = { title: 'New Job', description: 'Job description', location: 'Remote' };
      const mockRequest = { user: { id: 'employer1' } };
      const expectedJob = { id: '1', ...createJobDto };

      mockJobsService.createJob.mockResolvedValue(expectedJob);

      const result = await controller.create(createJobDto, mockRequest);

      expect(result).toEqual(expectedJob);
      expect(mockJobsService.createJob).toHaveBeenCalledWith('employer1', createJobDto);
    });
  });
});
