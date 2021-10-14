import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import jwt = require('jsonwebtoken')
import authConfig from '../config/auth.config'

export type AppTokenPayload = {
  chatId: string
  userId: number
}

@Injectable()
export class TokenService {
  private secret: string

  constructor(@Inject(authConfig.KEY) authCfg: ConfigType<typeof authConfig>) {
    this.secret = authCfg.jwtSecret
    if (!this.secret) {
      throw new Error('please set AUTH_JWT_SECRET to keep your data safe')
    }
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
