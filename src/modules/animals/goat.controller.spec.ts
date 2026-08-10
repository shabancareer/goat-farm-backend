import { Test, TestingModule } from '@nestjs/testing';
import { GoatController } from './goat.controller';
import { GoatService } from './goat.service';

describe('GoatController', () => {
  let controller: GoatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoatController],
      providers: [
        {
          provide: GoatService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<GoatController>(GoatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
