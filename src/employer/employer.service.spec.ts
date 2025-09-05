import { Test, TestingModule } from '@nestjs/testing';
import { EmployerService } from './employer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Employer } from '../utilis/entities/employer.entity';
import { AwsService } from '../aws/aws.service';

describe('EmployerService', () => {
  let service: EmployerService;

  const mockEmployerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAwsService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployerService,
        {
          provide: getRepositoryToken(Employer),
          useValue: mockEmployerRepository,
        },
        {
          provide: AwsService,
          useValue: mockAwsService,
        },
      ],
    }).compile();

    service = module.get<EmployerService>(EmployerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find employer by email', async () => {
      const email = 'employer@example.com';
      const expectedEmployer = { id: '1', email };

      mockEmployerRepository.findOne.mockResolvedValue(expectedEmployer);

      const result = await service.findByEmail(email);

      expect(result).toEqual(expectedEmployer);
      expect(mockEmployerRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });
  });
});
