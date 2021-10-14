import { Module } from '@nestjs/common'
import { SearchModule } from '../search/search.module'
import { ImportController } from './import.controller'

@Module({
  controllers: [ImportController],
  imports: [SearchModule],
})
export class ImportModule {}
