import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Param,
  Post,
} from '@nestjs/common'
import { SearchParams } from 'meilisearch'
import { TokenService } from 'src/token/token.service'
import { MeiliSearchService } from './meili-search.service'

@Controller('search')
export class SearchController {
  constructor(
    private meiliSearch: MeiliSearchService,
    private tokenService: TokenService,
  ) {}

  @Post('compilable/meili/indexes/:chatId/search')
  async meilisearchCompilable(
    @Param('chatId') chatIdInput: string,
    @Headers('X-Meili-API-Key') token: string,
    @Body() body: SearchParams & { q: string },
  ) {
    const { chatId } = this.tokenService.verify(token)
    if (chatId !== chatIdInput) {
      throw new ForbiddenException('无权访问该聊天，请从机器人按钮重新登录')
    }

    const { q, ...options } = body
    const filteredOptions = removeKeysFromObject(options, [
      'filter',
      'attributesToHighlight',
      'attributesToRetrieve',
    ])
    filteredOptions.filter = [`chatId = ${chatId}`]
    filteredOptions.attributesToHighlight = ['text']
    filteredOptions.attributesToRetrieve = [
      'text',
      'chatId',
      'messageId',
      'fromId',
      'fromName',
      'timestamp',
    ]
    // TODO: adds back the filter with fromId
    return await this.meiliSearch.getMessagesIndex().search(q, filteredOptions)
  }
}

function removeKeysFromObject<T extends Record<string, any>>(
  obj: T,
  keyToRemove: string | string[],
): T {
  const lowerKey = (
    Array.isArray(keyToRemove) ? keyToRemove : [keyToRemove]
  ).map((s) => s.toLowerCase())

  const localeLowerKey = (
    Array.isArray(keyToRemove) ? keyToRemove : [keyToRemove]
  ).map((s) => s.toLocaleLowerCase())

  return Object.entries(obj).reduce((acc: any, curEntry) => {
    const [key, val] = curEntry
    if (
      !localeLowerKey.includes(key.toLocaleLowerCase()) &&
      !lowerKey.includes(key.toLowerCase())
    ) {
      acc[key] = val
    }
    return acc
  }, {} as T)
}
