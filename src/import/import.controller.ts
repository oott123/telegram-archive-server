import { Body, Controller, Post } from '@nestjs/common'
import Debug from 'debug'
import {
  MeiliSearchService,
  MessageIndex,
} from '../search/meili-search.service'

const debug = Debug('app:import:import.controller')

type TelegramExportGroup = {
  name: string
  type: string
  id: number
  messages: TelegramExportMessageInGroup[]
}

type TelegramExportMessageInGroup = {
  id: number
  type: string
  date: string
  from: string
  from_id: `${'user' | 'channel' | 'group'}${string}`
  text: string | Array<{ type: string; text: string }>
}

const TelegramExportGroupTypeMap = {
  private_supergroup: 'supergroup',
}

@Controller('import')
export class ImportController {
  constructor(private readonly searchService: MeiliSearchService) {}

  @Post('fromTelegramGroupExport')
  async fromTelegramGroupExport(@Body() body: TelegramExportGroup) {
    const { id: groupId, type: groupType, messages } = body
    if (!groupId) {
      throw new Error('groupId is required')
    }
    if (!Array.isArray(messages)) {
      throw new Error('import data misformed: messages is not array')
    }
    debug(
      `import from telegram group export: ${groupType}:${groupId}, ${messages.length} messages`,
    )

    const mappedGroupType = TelegramExportGroupTypeMap[groupType]
    if (!mappedGroupType) {
      throw new Error(`import data misformed: unknown group type: ${groupType}`)
    }
    const chatId = `${mappedGroupType}${groupId}`

    const messageBuffer: MessageIndex[] = []
    let messageCount = 0
    for (const message of messages) {
      const { id, type, date, from, from_id, text } = message
      switch (type) {
        case 'message':
          if (Array.isArray(text)) {
            // check text has text
            if (
              text
                .filter((item) => typeof item !== 'string')
                .some((item) => typeof item.text !== 'string')
            ) {
              console.warn('message text dont have text', message)
              break
            }
          }
          const searchable = Array.isArray(text)
            ? text
                .map((item) => (typeof item === 'string' ? item : item.text))
                .join('')
            : text
          if (!searchable) {
            break
          }
          const messageIndex: MessageIndex = {
            id: `${chatId}__${id}`,
            messageId: id,
            chatId,
            fromId: from_id,
            fromName: from,
            text: searchable,
            raw: message,
            from: 'import',
            timestamp: new Date(date).getTime(),
          }
          messageBuffer.push(messageIndex)
          break
        case 'service':
          break
        default:
          console.warn('unknown message type', type, message)
          break
      }

      if (messageBuffer.length >= 10000) {
        messageCount += messageBuffer.length
        await this.searchService.importMessages(messageBuffer)
        messageBuffer.length = 0
      }
    }

    if (messageBuffer.length > 0) {
      messageCount += messageBuffer.length
      await this.searchService.importMessages(messageBuffer)
    }

    debug(
      `import from telegram group export: ${groupType}:${groupId}, ${messageCount} of ${messages.length} messages has been queued`,
    )

    return { queued: messageCount }
  }
}
