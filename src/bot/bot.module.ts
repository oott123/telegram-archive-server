import { Module } from '@nestjs/common'
import { SearchModule } from '../search/search.module'
import { BotService } from './bot.service'
import { WebhookController } from './webhook.controller'

@Module({
  imports: [SearchModule],
  providers: [BotService],
  exports: [BotService],
  controllers: [WebhookController],
})
export class BotModule {}
