import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { TokenService } from './tokens.service';
import { User } from '../users/schemas/user.schema';
import { Organisation } from '../organizations/schemas/organization.schema';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
        {
          provide: getModelToken(Organisation.name),
          useValue: {},
        },
        {
          provide: TokenService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
