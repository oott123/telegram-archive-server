import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { Bot, Context, GrammyError, NextFunction } from 'grammy'
import botConfig from '../config/bot.config'
import { MeiliSearchService } from '../search/meili-search.service'
import httpConfig from '../config/http.config'
import { PhotoSize, Update } from '@grammyjs/types'
import Debug = require('debug')
import fetch from 'node-fetch'
import createHttpsProxyAgent = require('https-proxy-agent')

const debug = Debug('app:bot:bot.service')

@Injectable()
export class BotService {
  private bot: Bot
  private useWebhook: boolean
  private baseUrl: string
  private updateToken: string
  private agent: any

  constructor(
    @Inject(botConfig.KEY)
    botCfg: ConfigType<typeof botConfig>,
    @Inject(httpConfig.KEY)
    httpCfg: ConfigType<typeof httpConfig>,
    private search: MeiliSearchService,
  ) {
    this.useWebhook = botCfg.webhook
    this.baseUrl = `${httpCfg.baseUrl}${httpCfg.globalPrefix}`
    this.updateToken = botCfg.updateToken || botCfg.token

    if (this.useWebhook && !this.baseUrl) {
      throw new Error(
        'You MUST set HTTP_BASE_URL if you have enabled TELEGRAM_WEBHOOK',
      )
    }

    this.agent = getProxyAgent()
    this.bot = new Bot(botCfg.token, {
      client: {
        baseFetchConfig: {
          agent: this.agent,
          compress: true,
        },
      },
    })

    this.bot.on('msg', this.botOnMessage)

    if (botCfg.followEdit) {
      this.bot.on('edit', this.botOnMessage)
    }

    this.bot.command('search', this.botOnSearchCommand)
  }

  async start() {
    if (this.useWebhook) {
      await this.bot.init()
      return this.setWebhookUrl()
    } else {
      await this.startPolling()
    }
  }

  public async checkIfUserIsMember(userId: number, chatId: string) {
    const id = this.chatId2ApiId(chatId)
    const { status } = await this.bot.api.getChatMember(id, userId)

    return (
      status === 'member' || status === 'creator' || status === 'administrator'
    )
  }

  public chatId2ApiId(chatId: string) {
    return Number(chatId.replace(/^supergroup/, '-100').replace(/^group/, '-'))
  }

  public async getProfilePhoto(userId: number) {
    const { photos } = await this.tryGetPhotos(userId)
    if (photos.length < 1 || photos[0].length < 1) {
      return null
    }

    const { file_id: fileId } = getSmallestPhoto(photos[0])
    const { file_path: filePath } = await this.bot.api.getFile(fileId)
    const fileUrl = `https://api.telegram.org/file/bot${this.bot.token}/${filePath}`

    const res = await fetch(fileUrl, { agent: this.agent })

    return res
  }

  private botOnMessage = async (ctx: Context, next: NextFunction) => {
    await next()
    const { msg, chat, from } = ctx
    if (!chat || !msg || !from) {
      return
    }
    const realId = `${chat.id}`.replace(/^-100/, '')
    const chatId = `${chat.type}${realId}`
    const searchable = msg?.text || msg?.caption
    if (!searchable) {
      return
    }

    await this.search.queueMessage({
      id: `${chatId}__${msg.message_id}`,
      messageId: msg.message_id,
      chatId,
      fromId: `user${from.id}`,
      fromName: joinNames(from.first_name, from.last_name),
      text: searchable,
      raw: ctx.msg,
      from: 'bot',
      timestamp: msg.date * 1000,
    })
  }

  private botOnSearchCommand = async (ctx: Context) => {
    const { msg, chat, from } = ctx
    if (!chat || !msg || !from) {
      return
    }

    if (chat.type === 'private') {
      await ctx.reply('？')
      return
    }

    const realId = `${chat.id}`.replace(/^-100/, '')
    const chatId = `${chat.type}${realId}`
    const authUrl = new URL(this.baseUrl + '/user/auth/viaTelegram')
    authUrl.searchParams.append('chatId', chatId)

    try {
      await ctx.reply('🔍群内消息搜索试运行中，有问题请点我头像', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '搜索',
                login_url: {
                  url: authUrl.toString(),
                  request_write_access: true,
                  forward_text: `搜索「${chat.title}」`,
                },
              },
            ],
          ],
        },
      })
    } catch (e: any) {
      if (
        e instanceof GrammyError &&
        (e.description.includes('login URL is invalid') ||
          e.description.includes('BOT_DOMAIN_INVALID'))
      ) {
        await ctx.reply(
          `当前无法使用登录，请联系 @BotFather 在 Settings / Domain 处将域名修改为 <code>${authUrl.hostname}</code>`,
          { parse_mode: 'HTML' },
        )
      } else {
        throw e
      }
    }
  }

  private async tryGetPhotos(userId: number) {
    try {
      return await this.bot.api.getUserProfilePhotos(userId, {
        limit: 1,
      })
    } catch (e: any) {
      if (e.message.includes('user not found')) {
        return { photos: [] }
      } else {
        throw e
      }
    }
  }

  private async setWebhookUrl() {
    const url = `${this.baseUrl}/bot/webhook/${this.updateToken}/update`
    await this.bot.api.setWebhook(url)
  }

  private async startPolling() {
    void this.bot.start()
  }

  public handleUpdate(update: Update) {
    return this.bot.handleUpdate(update)
  }

  public checkUpdateToken(tokenInput: string) {
    return tokenInput === this.updateToken
  }
}

function joinNames(firstName: string, lastName: string | undefined) {
  return [firstName, lastName].filter((x) => x).join(' ')
}

function getProxyAgent() {
  const proxy = process.env.https_proxy || process.env.http_proxy
  if (!proxy) {
    return
  }

  return createHttpsProxyAgent(proxy)
}

function getSmallestPhoto(photos: PhotoSize[]): PhotoSize {
  const sorted = photos.sort((a, b) => a.width - b.width)
  return sorted[0]
}
