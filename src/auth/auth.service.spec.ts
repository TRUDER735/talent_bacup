import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { TalentsService } from '../talents/talents.service';
import { EmployerService } from '../employer/employer.service';
import { OtpService } from './otp.service';

describe('AuthService', () => {
  let service: AuthService<any>;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockTalentsService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockEmployerService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockOtpService = {
    generateOtp: jest.fn(),
    verifyOtp: jest.fn(),
    sendOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TalentsService,
          useValue: mockTalentsService,
        },
        {
          provide: EmployerService,
          useValue: mockEmployerService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
      ],
    }).compile();

    service = module.get<AuthService<any>>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'talent' as 'talent',
      };

      mockTalentsService.findByEmail.mockResolvedValue(null);
      mockTalentsService.create.mockResolvedValue({ id: '1', email: 'test@example.com' });
      mockOtpService.generateOtp.mockReturnValue('123456');

      const result = await service.signUp(signupDto);

      expect(result).toBeDefined();
      expect(mockTalentsService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });
});
