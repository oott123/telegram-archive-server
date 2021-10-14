import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Inject,
  Query,
  Redirect,
} from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { TokenService } from 'src/token/token.service'
import botConfig from '../config/bot.config'
import httpConfig from '../config/http.config'

@Controller('user/auth')
export class AuthController {
  private botToken: string
  private uiUrl: string
  private baseUrl: string

  constructor(
    @Inject(httpConfig.KEY) httpCfg: ConfigType<typeof httpConfig>,
    @Inject(botConfig.KEY) botCfg: ConfigType<typeof botConfig>,
    private tokenService: TokenService,
  ) {
    this.botToken = botCfg.token
    this.uiUrl = httpCfg.uiUrl
    this.baseUrl = `${httpCfg.baseUrl}${httpCfg.globalPrefix}`
  }

  // chatId=supergroup1098355009&id=29947350&first_name=三三&username=stupid33&photo_url=https%3A%2F%2Ft.me%2Fi%2Fuserpic%2F320%2FOm2VdBoFI8c9cDtdtheFHpFK8c-W5rjEtTFolUe4O6I.jpg&auth_date=1634173284&hash=somehex
  @Get('viaTelegram')
  @Header('Cache-Control', 'no-cache, no-store')
  @Redirect('/', 302)
  public async authCallback(
    @Query('chatId') chatId: string,
    @Query('id') userId: string,
    @Query('first_name') firstName: string,
    @Query('last_name') lastName: string,
    @Query('username') username: string,
    @Query('photo_url') photoUrl: string,
    @Query('auth_date') authDate: string,
    @Query('hash') hash: string,
  ): Promise<{ url: string }> {
    const telegramLogin = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      username,
      photo_url: photoUrl,
      auth_date: authDate,
    }

    await this.verifyHash(telegramLogin, hash)

    const token = this.tokenService.sign({ userId: Number(userId), chatId })

    const url = new URL(`${this.uiUrl}/index.html`)
    url.searchParams.append('tas_server', this.baseUrl)
    url.searchParams.append('tas_indexName', chatId)
    url.searchParams.append('tas_authKey', token)

    return { url: url.toString() }
  }

  private async verifyHash(
    loginObject: Record<string, string>,
    inputHash: string,
  ) {
    const authDate = loginObject.auth_date
    if (!authDate) {
      throw new ForbiddenException('No auth_date in login')
    }

    if (Math.abs(Number(authDate) * 1000 - Date.now()) > 5 * 60 * 1000) {
      throw new ForbiddenException('Invalid auth date')
    }

    // Data-check-string is a concatenation of all received fields, sorted in alphabetical order, in the format key=<value> with a line feed character ('\n', 0x0A) used as separator
    const keys = Object.keys(loginObject).sort()
    const dataCheckString = keys
      .reduce(
        (acc, key) =>
          loginObject[key] ? `${acc}${key}=${loginObject[key]}\n` : acc,
        '',
      )
      .trimEnd()

    // You can verify the authentication and the integrity of the data received by comparing the received hash parameter with the hexadecimal representation of the HMAC-SHA-256 signature of the data-check-string with the SHA256 hash of the bot's token used as a secret key.
    const sha = createHash('sha256').update(this.botToken).digest()

    const hmac = createHmac('sha256', sha)
    hmac.update(dataCheckString)
    if (!timingSafeEqual(hmac.digest(), Buffer.from(inputHash, 'hex'))) {
      throw new ForbiddenException('Invalid hash')
    }
  }
}
