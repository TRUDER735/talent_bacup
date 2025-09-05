import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Application } from '../utilis/entities/application.entity';
import { Job } from '../utilis/entities/job.entity';
import { TalentEntity as Talent } from '../utilis/entities/talent.entity';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  const mockApplicationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTalentRepository = {
    findOne: jest.fn(),
  };

  const mockJobRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepository,
        },
        {
          provide: getRepositoryToken(Talent),
          useValue: mockTalentRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addApplication', () => {
    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(service.addApplication('invalid-id', 'invalid-id')).rejects.toThrow('Invalid ID format');
    });
  });
});
