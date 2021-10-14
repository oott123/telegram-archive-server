import { Module } from '@nestjs/common'
import { TokenModule } from 'src/token/token.module'
import { MeiliSearchService } from './meili-search.service'
import { SearchController } from './search.controller'

@Module({
  imports: [TokenModule],
  providers: [MeiliSearchService],
  exports: [MeiliSearchService],
  controllers: [SearchController],
})
export class SearchModule {}
