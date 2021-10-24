import { Module } from '@nestjs/common'
import { TokenModule } from 'src/token/token.module'
import { MeiliSearchService } from './meili-search.service'
import { SearchController } from './search.controller'
import { IndexService } from './index.service'
import { ImageIndexService } from './image-index.service'
import { QueueModule } from 'src/queue/queue.module'
import { OCRModule } from 'src/ocr/ocr.module'

@Module({
  imports: [TokenModule, QueueModule, OCRModule],
  providers: [MeiliSearchService, IndexService, ImageIndexService],
  exports: [MeiliSearchService, IndexService, ImageIndexService],
  controllers: [SearchController],
})
export class SearchModule {}
