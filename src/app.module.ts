import { CacheModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config'
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
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { OCRModule } from './ocr/ocr.module'
import { QueueModule } from './queue/queue.module'
import cacheConfig from './config/cache.config'
import redisStore = require('cache-manager-ioredis')
import ocrConfig from './config/ocr.config'
import queueConfig from './config/queue.config'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [
        meilisearchConfig,
        botConfig,
        httpConfig,
        authConfig,
        cacheConfig,
        ocrConfig,
        queueConfig,
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (cacheCfg: ConfigType<typeof cacheConfig>) => {
        if (cacheCfg.cacheStore === 'memory') {
          return {}
        } else if (cacheCfg.cacheStore === 'redis') {
          return {
            ...cacheCfg.redis,
            store: redisStore,
            ttl: cacheCfg.ttl,
          }
        } else {
          throw new Error(`No such cache store ${cacheCfg.cacheStore}`)
        }
      },
      inject: [cacheConfig.KEY],
    }),
    SearchModule,
    ImportModule,
    BotModule,
    UserModule,
    TokenModule,
    OCRModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
