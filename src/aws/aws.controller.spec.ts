import { Test, TestingModule } from '@nestjs/testing';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';

describe('AwsController', () => {
  let controller: AwsController;
  let awsService: AwsService;

  const mockAwsService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AwsController],
      providers: [
        {
          provide: AwsService,
          useValue: mockAwsService,
        },
      ],
    }).compile();

    controller = module.get<AwsController>(AwsController);
    awsService = module.get<AwsService>(AwsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadProfileImage', () => {
    it('should upload profile image successfully', async () => {
      const userId = 'test-user-id';
      const file = Buffer.from('test file content');
      const expectedUrl = 'test-uploaded-url';

      mockAwsService.uploadFile.mockResolvedValue(expectedUrl);

      const result = await controller.uploadProfileImage(userId, file);

      expect(result).toEqual({
        status: 201,
        body: {
          message: 'Profile image uploaded successfully',
          url: expectedUrl,
        },
      });
      expect(mockAwsService.uploadFile).toHaveBeenCalledWith(
        file,
        expect.stringContaining(`profile-${userId}-`)
      );
    });
  });
});
