import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GoatService } from './goat.service';
import { Goat } from './schemas/goat.schema';

describe('GoatService', () => {
  let service: GoatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoatService,
        {
          provide: getModelToken(Goat.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<GoatService>(GoatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
