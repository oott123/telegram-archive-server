import { CacheModule, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SearchModule } from './search/search.module'
import { ImportModule } from './import/import.module'
import { BotModule } from './bot/bot.module'
import { UserModule } from './user/user.module'
import { TokenModule } from './token/token.module'
import meilisearchConfig from './config/meilisearch.config'
import botConfig from './config/bot.config'
import httpConfig from './config/http.config'
import authConfig from './config/auth.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [meilisearchConfig, botConfig, httpConfig, authConfig],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    SearchModule,
    ImportModule,
    BotModule,
    UserModule,
    TokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
