import { Module } from '@nestjs/common'
import { SearchModule } from 'src/search/search.module'
import { GrammyService } from './grammy.service'
import { WebhookController } from './webhook.controller'

@Module({
  imports: [SearchModule],
  providers: [GrammyService],
  controllers: [WebhookController],
})
export class BotModule {}
