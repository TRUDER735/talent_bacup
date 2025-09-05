import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let applicationsService: ApplicationsService;

  const mockApplicationsService = {
    addApplication: jest.fn(),
    inviteApplicant: jest.fn(),
    getApplicationsByTalent: jest.fn(),
    getApplicationsByEmployer: jest.fn(),
    updateApplicationStatus: jest.fn(),
    getApplicationById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: mockApplicationsService,
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
    applicationsService = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('applyToJob', () => {
    it('should apply to job successfully', async () => {
      const mockApplication = { id: '1', talentId: 'talent1', jobId: 'job1' };
      const mockRequest = { user: { id: 'talent1' } };
      
      mockApplicationsService.addApplication.mockResolvedValue(mockApplication);

      const result = await controller.applyToJob('job1', mockRequest, 'cover letter');

      expect(result).toEqual(mockApplication);
      expect(mockApplicationsService.addApplication).toHaveBeenCalledWith('talent1', 'job1', 'cover letter');
    });

    it('should throw BadRequestException when talent ID is missing', async () => {
      const mockRequest = { user: null };

      await expect(controller.applyToJob('job1', mockRequest, 'cover letter')).rejects.toThrow('Invalid talent');
    });
  });
});
