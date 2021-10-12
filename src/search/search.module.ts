import { Module } from '@nestjs/common'
import { MeiliSearchService } from './meili-search.service'
import { SearchController } from './search.controller'

@Module({
  providers: [MeiliSearchService],
  exports: [MeiliSearchService],
  controllers: [SearchController],
})
export class SearchModule {}
