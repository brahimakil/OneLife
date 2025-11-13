import { Test, TestingModule } from '@nestjs/testing';
import { GymRoutinesService } from './gym-routines.service';

describe('GymRoutinesService', () => {
  let service: GymRoutinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GymRoutinesService],
    }).compile();

    service = module.get<GymRoutinesService>(GymRoutinesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
