import { Test, TestingModule } from '@nestjs/testing';
import { TalentsController } from './talents.controller';
import { TalentsService } from './talents.service';

describe('TalentsController', () => {
  let controller: TalentsController;
  let talentsService: TalentsService;

  const mockTalentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByEmail: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TalentsController],
      providers: [
        {
          provide: TalentsService,
          useValue: mockTalentsService,
        },
      ],
    }).compile();

    controller = module.get<TalentsController>(TalentsController);
    talentsService = module.get<TalentsService>(TalentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
