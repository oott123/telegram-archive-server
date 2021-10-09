import { Test, TestingModule } from '@nestjs/testing'
import { MeiliSearchService } from './meili-search.service'

describe('MeiliSearchService', () => {
  let service: MeiliSearchService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeiliSearchService],
    }).compile()

    service = module.get<MeiliSearchService>(MeiliSearchService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
