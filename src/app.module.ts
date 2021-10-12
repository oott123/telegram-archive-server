import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SearchModule } from './search/search.module'
import { ImportModule } from './import/import.module'
import meilisearchConfig from './config/meilisearch.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [meilisearchConfig],
    }),
    SearchModule,
    ImportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
