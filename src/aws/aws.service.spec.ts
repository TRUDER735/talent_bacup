import { Test, TestingModule } from '@nestjs/testing';
import { AwsService } from './aws.service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    destroy: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock('./aws.config', () => ({
  awsS3Config: {
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    },
  },
}));

describe('AwsService', () => {
  let service: AwsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsService],
    }).compile();

    service = module.get<AwsService>(AwsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
      });
      
      (service as any).s3Client.send = mockSend;

      const buffer = Buffer.from('test content');
      const filename = 'test-file.jpg';

      const result = await service.uploadFile(buffer, filename);

      expect(result).toBe(filename);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle upload failure', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        $metadata: { httpStatusCode: 500 },
      });
      
      (service as any).s3Client.send = mockSend;

      const buffer = Buffer.from('test content');
      const filename = 'test-file.jpg';

      const result = await service.uploadFile(buffer, filename);
      
      expect(result).toContain('Error uploading file');
    });
  });
});
