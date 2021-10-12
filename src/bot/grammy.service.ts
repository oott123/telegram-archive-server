import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { Bot, Context } from 'grammy'
import botConfig from '../config/bot.config'
import SocksAgent = require('socks5-https-client/lib/Agent')
import { MeiliSearchService } from 'src/search/meili-search.service'
import httpConfig from 'src/config/http.config'
import { Update } from '@grammyjs/types'

@Injectable()
export class GrammyService {
  private bot: Bot
  private useWebhook: boolean
  private baseUrl: string
  private updateToken: string

  constructor(
    @Inject(botConfig.KEY)
    botCfg: ConfigType<typeof botConfig>,
    @Inject(httpConfig.KEY)
    httpCfg: ConfigType<typeof httpConfig>,
    private search: MeiliSearchService,
  ) {
    this.useWebhook = botCfg.webhook
    this.baseUrl = `${httpCfg.baseUrl}/${httpCfg.globalPrefix}`
    this.updateToken = botCfg.updateToken || botCfg.token

    if (this.useWebhook && !this.baseUrl) {
      throw new Error(
        'You MUST set HTTP_BASE_URL if you have enabled TELEGRAM_WEBHOOK',
      )
    }

    const agent = getProxyAgent()
    this.bot = new Bot(botCfg.token, {
      client: {
        baseFetchConfig: {
          agent,
          compress: true,
        },
      },
    })

    this.bot.on('msg', this.botOnMessage)

    if (botCfg.followEdit) {
      this.bot.on('edit', this.botOnMessage)
    }
  }

  async start() {
    await this.bot.init()
    if (this.useWebhook) {
      return this.setWebhookUrl()
    } else {
      await this.startPolling()
    }
  }

  private botOnMessage = async (ctx: Context) => {
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

    await this.search.importMessages([
      {
        id: `${chatId}__${msg.message_id}`,
        messageId: msg.message_id,
        chatId,
        fromId: `user${from.id}`,
        fromName: joinNames(from.first_name, from.last_name),
        text: searchable,
        raw: ctx.msg,
        from: 'bot',
        timestamp: msg.date * 1000,
      },
    ])
  }

  private async setWebhookUrl() {
    const url = `${this.baseUrl}/bot/webhook/${this.updateToken}/update`
    await this.bot.api.setWebhook(url)
  }

  private startPolling() {
    return this.bot.start()
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
  if (!process.env.https_proxy) {
    return
  }
  const url = new URL(process.env.https_proxy)
  const socksAgent = new SocksAgent({
    socksHost: url.hostname,
    socksPort: url.port,
    socksUsername: url.username,
    socksPassword: url.password,
  })

  return socksAgent
}
