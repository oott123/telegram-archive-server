import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import meilisearchConfig from '../config/meilisearch.config'
import { Index, MeiliSearch, Settings } from 'meilisearch'
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

export type OptionalTextMessageIndex = Omit<MessageIndex, 'text'> & {
  text: string | undefined
}

@Injectable()
export class MeiliSearchService {
  private client: MeiliSearch
  private indexPrefix: string
  private messagesIndex: Index<MessageIndex>

  public constructor(
    @Inject(meilisearchConfig.KEY)
    msConfig: ConfigType<typeof meilisearchConfig>,
  ) {
    this.client = new MeiliSearch(msConfig)
    this.indexPrefix = msConfig.indexPrefix
    this.messagesIndex = this.client.index<MessageIndex>(
      `${this.indexPrefix}messages`,
    )
  }

  public async migrate(): Promise<void> {
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

  public async importMessages(messages: MessageIndex[]): Promise<void> {
    await this.messagesIndex.addDocuments(messages)
  }

  public async search(query: string, chatId: string, fromId?: number) {
    const result = await this.messagesIndex.search<MessageIndex>(query, {
      filter: [
        `chatId = ${chatId}`,
        ...[fromId == null ? [] : [`fromId = ${fromId}`]],
      ],
    })
    return result
  }

  public getMessagesIndex() {
    return this.messagesIndex
  }
}
