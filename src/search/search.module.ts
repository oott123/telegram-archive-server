import { Module } from '@nestjs/common'
import { MeiliSearchService } from './meili-search.service'

@Module({
  providers: [MeiliSearchService],
  exports: [MeiliSearchService],
})
export class SearchModule {}
