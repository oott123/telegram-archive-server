import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { MeiliSearchService } from './search/meili-search.service'
import Debug from 'debug'

const debug = Debug('app:main')

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection caught, process exiting')
  console.error(reason)
  process.exit(1)
})

async function bootstrap() {
  debug('bootstrapping app')

  debug('creating app')
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 100 * 1024 * 1024,
    }),
  )
  app.setGlobalPrefix('/api/v1')

  debug('migrating search')
  const search = app.get(MeiliSearchService)
  await search.migrate()

  debug('starting http')
  await app.listen(3100)
}
bootstrap()
