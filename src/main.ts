import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { MeiliSearchService } from './search/meili-search.service'
import Debug from 'debug'
import httpConfig from './config/http.config'
import { ConfigType } from '@nestjs/config'
import { BotService } from './bot/bot.service'
import { IndexService } from './search/index.service'
import { ImageIndexService } from './search/image-index.service'
import { Logger } from '@nestjs/common'

const debug = Debug('app:main')

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection caught, process exiting')
  console.error(reason)
  process.exit(1)
})

async function bootstrap() {
  debug('bootstrapping app')

  const logger = new Logger('bootstrap')
  const [role] = process.argv.slice(2)
  const roles = role ? role.split(',') : ['bot', 'ocr']
  logger.log(`Starting roles ${roles.join(', ')}`)

  debug('creating app')
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 100 * 1024 * 1024,
    }),
    {
      cors: {
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Meili-API-Key'],
        origin: '*',
        maxAge: 86400,
      },
    },
  )

  const httpCfg = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY)
  app.setGlobalPrefix(httpCfg.globalPrefix)

  if (roles.includes('bot')) {
    debug('creating bot')
    const bot = app.get(BotService)
    await bot.start()

    debug('migrating search')
    const search = app.get(MeiliSearchService)
    await search.migrate()

    debug('recovering index')
    const index = app.get(IndexService)
    await index.recoverFromCache()

    debug('start async index handler')
    await index.startHandleAsyncMessage()
  }

  if (roles.includes('ocr')) {
    debug('start ocr handler')
    const imageIndex = app.get(ImageIndexService)
    await imageIndex.startHandleOCR()
  }

  debug('enable shutdown hooks')
  app.enableShutdownHooks()

  if (roles.includes('bot')) {
    debug('starting http')
    await app.listen(httpCfg.port, httpCfg.host)
  }

  logger.log('App bootstrap finished')
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
