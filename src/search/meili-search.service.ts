import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import meilisearchConfig from '../config/meilisearch.config'
import { Index, MeiliSearch, Settings } from 'meilisearch'
import { MessageIndex } from 'src/types/indexes'
import deepEqual from 'deep-equal'

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
      filterableAttributes: ['chatId', 'senderId'],
    }
    const sortableAttributes = [
      'words',
      'sort',
      'typo',
      'proximity',
      'exactness',
      'timestamp:desc',
    ]

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

  async search(query: string, chatId: number, senderId?: number) {
    const result = await this.messagesIndex.search<MessageIndex>(query, {
      filter: [
        `chatId = ${chatId}`,
        ...[senderId == null ? [] : [`senderId = ${senderId}`]],
      ],
    })
    return result
  }
}
