import { Module } from '@nestjs/common'
import { BotModule } from '../bot/bot.module'
import { TokenModule } from '../token/token.module'
import { AuthController } from './auth.controller'
import { ProfileController } from './profile.controller'

@Module({
  controllers: [ProfileController, AuthController],
  imports: [BotModule, TokenModule],
})
export class UserModule {}
