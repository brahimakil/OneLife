import { Test, TestingModule } from '@nestjs/testing';
import { GymRoutinesController } from './gym-routines.controller';

describe('GymRoutinesController', () => {
  let controller: GymRoutinesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymRoutinesController],
    }).compile();

    controller = module.get<GymRoutinesController>(GymRoutinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
