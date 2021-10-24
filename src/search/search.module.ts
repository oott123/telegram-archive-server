import { Module } from '@nestjs/common'
import { TokenModule } from 'src/token/token.module'
import { MeiliSearchService } from './meili-search.service'
import { SearchController } from './search.controller'
import { IndexService } from './index.service'

@Module({
  imports: [TokenModule],
  providers: [MeiliSearchService, IndexService],
  exports: [MeiliSearchService, IndexService],
  controllers: [SearchController],
})
export class SearchModule {}
