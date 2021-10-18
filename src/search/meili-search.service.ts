import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import meilisearchConfig from '../config/meilisearch.config'
import { Index, MeiliSearch, Settings } from 'meilisearch'
import { Cache } from 'cache-manager'
import Debug from 'debug'
import deepEqual = require('deep-equal')

const debug = Debug('app:search:meili')

export type MessageIndex = {
  id: string
  messageId: number
  chatId: string
  fromId: string
  fromName: string
  /** searchable text */
  text: string
  raw: any
  from: 'import' | 'bot'
  timestamp: number
}

const MESSAGES_QUEUE_KEY = 'messages'
const INSERT_BATCH = 100
const INSERT_TIMEOUT = 60 * 1000

@Injectable()
export class MeiliSearchService implements OnModuleDestroy {
  private client: MeiliSearch
  private indexPrefix: string
  private messagesIndex: Index<MessageIndex>
  private messagesQueue: MessageIndex[]
  private queueTimer: any

  constructor(
    @Inject(meilisearchConfig.KEY)
    msConfig: ConfigType<typeof meilisearchConfig>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    this.client = new MeiliSearch(msConfig)
    this.indexPrefix = msConfig.indexPrefix
    this.messagesIndex = this.client.index<MessageIndex>(
      `${this.indexPrefix}messages`,
    )
    this.messagesQueue = []
  }

  async onModuleDestroy() {
    debug('app exiting, writing queue to cache')
    // await this.writeToCache()
    await this.importAllQueued()
  }

  async recoverFromCache() {
    const queue = await this.cache.get<MessageIndex[]>(MESSAGES_QUEUE_KEY)
    if (queue && Array.isArray(queue)) {
      this.messagesQueue = queue.concat(this.messagesQueue)
    }
    if (this.messagesQueue.length > 0) {
      debug(`${this.messagesQueue.length} items recovered from cache`)
      await this.importAllQueued()
    }
  }

  async writeToCache() {
    debug(`writing cache (${this.messagesQueue.length} items)`)
    await this.cache.set(MESSAGES_QUEUE_KEY, this.messagesQueue, { ttl: 0 })
  }

  async importAllQueued() {
    if (this.messagesQueue.length < 1) {
      return
    }
    debug('importing all queued message')
    const queue = this.messagesQueue
    this.messagesQueue = []
    try {
      await this.importMessages(queue)
    } catch (e) {
      this.messagesQueue = queue.concat(this.messagesQueue)
      throw e
    }
    await this.writeToCache()
  }

  async migrate(): Promise<void> {
    const settings: Settings = {
      searchableAttributes: ['text'],
      filterableAttributes: ['chatId', 'fromId', 'timestamp'],
      sortableAttributes: ['timestamp'],
      synonyms: {
        妈: ['🐴', '马'],
        草: ['🌿', '艹', '操', '肏'],
        CF: ['CloudFlare', 'Cloud Flare'],
        CloudFlare: ['CF'],
      },
    }
    const rankingRules = [
      'words',
      'sort',
      'typo',
      'proximity',
      'exactness',
      'timestamp:desc',
    ]

    await this.client.getOrCreateIndex(this.messagesIndex.uid)
    await this.messagesIndex.fetchInfo()

    const currentSettings = await this.messagesIndex.getSettings()
    for (const key of Object.keys(settings)) {
      if (!deepEqual(currentSettings[key], settings[key])) {
        await this.messagesIndex.updateSettings(settings)
        break
      }
    }

    const currentRankingRules = await this.messagesIndex.getRankingRules()
    if (!deepEqual(currentRankingRules, rankingRules)) {
      await this.messagesIndex.updateRankingRules(rankingRules)
    }
  }

  queueMessage(message: MessageIndex) {
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

  async importMessages(messages: MessageIndex[]): Promise<void> {
    await this.messagesIndex.addDocuments(messages)
  }

  async search(query: string, chatId: string, fromId?: number) {
    const result = await this.messagesIndex.search<MessageIndex>(query, {
      filter: [
        `chatId = ${chatId}`,
        ...[fromId == null ? [] : [`fromId = ${fromId}`]],
      ],
    })
    return result
  }

  getMessagesIndex() {
    return this.messagesIndex
  }
}
