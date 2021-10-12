import { Module } from '@nestjs/common'
import { MeiliSearchService } from './meili-search.service'

@Module({
  providers: [MeiliSearchService],
})
export class SearchModule {}
