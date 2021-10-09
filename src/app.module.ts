import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SearchModule } from './search/search.module'
import meilisearchConfig from './config/meilisearch.config'

@Module({
  imports: [
    SearchModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [meilisearchConfig],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
