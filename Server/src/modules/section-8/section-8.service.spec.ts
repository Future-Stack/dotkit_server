import { Test, TestingModule } from '@nestjs/testing';
import { Section8Service } from './section-8.service';

describe('Section8Service', () => {
  let service: Section8Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Section8Service],
    }).compile();

    service = module.get<Section8Service>(Section8Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
