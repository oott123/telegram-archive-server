import { Module } from '@nestjs/common'
import { BotModule } from 'src/bot/bot.module'
import { ProfileController } from './profile.controller'

@Module({
  controllers: [ProfileController],
  imports: [BotModule],
})
export class UserModule {}
