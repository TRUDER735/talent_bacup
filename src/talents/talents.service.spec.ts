import { Test, TestingModule } from '@nestjs/testing';
import { TalentsService } from './talents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TalentEntity } from '../utilis/entities/talent.entity';
import { AwsService } from '../aws/aws.service';

describe('TalentsService', () => {
  let service: TalentsService;

  const mockTalentRepository = {
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
        TalentsService,
        {
          provide: getRepositoryToken(TalentEntity),
          useValue: mockTalentRepository,
        },
        {
          provide: AwsService,
          useValue: mockAwsService,
        },
      ],
    }).compile();

    service = module.get<TalentsService>(TalentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find talent by email', async () => {
      const email = 'test@example.com';
      const expectedTalent = { id: '1', email };

      mockTalentRepository.findOne.mockResolvedValue(expectedTalent);

      const result = await service.findByEmail(email);

      expect(result).toEqual(expectedTalent);
      expect(mockTalentRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });
  });
});
