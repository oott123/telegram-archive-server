import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common'
import { MeiliSearchService, MessageIndex } from './meili-search.service'
import Debug from 'debug'
import { Cache } from 'cache-manager'
import { QueueProcessor } from 'src/queue/meta.types'
import { QueueService } from 'src/queue/queue.service'

const debug = Debug('app:search:index')

const MESSAGES_QUEUE_KEY = 'messages'
const INSERT_BATCH = 100
const INSERT_TIMEOUT = 60 * 1000

@Injectable()
export class IndexService implements OnModuleDestroy {
  private messagesQueue: MessageIndex[]
  private queueTimer: any

  public constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private search: MeiliSearchService,
    private asyncQueue: QueueService,
  ) {
    this.messagesQueue = []
  }

  public async recoverFromCache() {
    const queue = await this.cache.get<MessageIndex[]>(MESSAGES_QUEUE_KEY)
    if (queue && Array.isArray(queue)) {
      this.messagesQueue = queue.concat(this.messagesQueue)
    }
    if (this.messagesQueue.length > 0) {
      debug(`${this.messagesQueue.length} items recovered from cache`)
      await this.importAllQueued()
    }
  }

  public async writeToCache() {
    debug(`writing cache (${this.messagesQueue.length} items)`)
    await this.cache.set(MESSAGES_QUEUE_KEY, this.messagesQueue, { ttl: 0 })
  }

  public async importAllQueued() {
    if (this.messagesQueue.length < 1) {
      return
    }
    debug('importing all queued message')
    const queue = this.messagesQueue
    this.messagesQueue = []
    try {
      await this.search.importMessages(queue)
    } catch (e) {
      this.messagesQueue = queue.concat(this.messagesQueue)
      throw e
    }
    await this.writeToCache()
  }

  public queueMessage(message: MessageIndex) {
    debug('adding message to queue')
    this.messagesQueue.push(message)

    this.writeToCache().catch(console.error)

    this.queueTimer && clearTimeout(this.queueTimer)

    if (this.messagesQueue.length >= INSERT_BATCH) {
      debug('message batch reached')
      this.importAllQueued().catch(console.error)
    } else {
      this.queueTimer = setTimeout(() => {
        debug('insert timeout reached')
        this.importAllQueued().catch(console.error)
      }, INSERT_TIMEOUT)
    }
  }

  public async onModuleDestroy() {
    debug('app exiting, writing queue to cache')
    // await this.writeToCache()
    await this.importAllQueued()
  }

  public async startHandleAsyncMessage() {
    await this.asyncQueue.process('message', this.handleAsyncMessage)
  }

  private handleAsyncMessage: QueueProcessor<'message'> = async ({
    message,
  }) => {
    this.queueMessage(message)
  }
}
