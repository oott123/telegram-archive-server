import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import jwt = require('jsonwebtoken')
import httpConfig from '../config/http.config'

export type AppTokenPayload = {
  chatId: string
  userId: number
}

@Injectable()
export class TokenService {
  private secret: string

  constructor(@Inject(httpConfig.KEY) httpCfg: ConfigType<typeof httpConfig>) {
    this.secret = httpCfg.jwtSecret
  }

  public sign(payload: AppTokenPayload) {
    return jwt.sign(payload, this.secret, { expiresIn: '1d' })
  }

  public verify(token: string) {
    try {
      return jwt.verify(token, this.secret) as AppTokenPayload
    } catch (err) {
      throw new ForbiddenException('Invalid token')
    }
  }
}
