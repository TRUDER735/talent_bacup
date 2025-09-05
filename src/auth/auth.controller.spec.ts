import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService<any>;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService<any>>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should sign up a user successfully', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'talent' as 'talent',
      };

      const expectedResult = { message: 'User created successfully' };
      mockAuthService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(signupDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(signupDto);
    });
  });
});
