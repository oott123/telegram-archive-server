import { Module } from '@nestjs/common'
import { SearchModule } from 'src/search/search.module'
import { BotService } from './bot.service'
import { WebhookController } from './webhook.controller'

@Module({
  imports: [SearchModule],
  providers: [BotService],
  controllers: [WebhookController],
})
export class BotModule {}
