import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import meilisearchConfig from '../config/meilisearch.config'
import { Index, MeiliSearch, Settings } from 'meilisearch'
import deepEqual = require('deep-equal')

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

@Injectable()
export class MeiliSearchService {
  private client: MeiliSearch
  private indexPrefix: string
  private messagesIndex: Index<MessageIndex>

  constructor(
    @Inject(meilisearchConfig.KEY)
    msConfig: ConfigType<typeof meilisearchConfig>,
  ) {
    this.client = new MeiliSearch(msConfig)
    this.indexPrefix = msConfig.indexPrefix
    this.messagesIndex = this.client.index<MessageIndex>(
      `${this.indexPrefix}messages`,
    )
  }

  async migrate(): Promise<void> {
    const settings: Settings = {
      searchableAttributes: ['text'],
      filterableAttributes: ['chatId', 'fromId'],
    }
    const sortableAttributes = [
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

    const currentSortableAttributes =
      await this.messagesIndex.getSortableAttributes()
    if (!deepEqual(currentSortableAttributes, sortableAttributes)) {
      await this.messagesIndex.updateSortableAttributes(sortableAttributes)
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
