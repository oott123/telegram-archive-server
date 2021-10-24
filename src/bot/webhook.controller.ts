import type { Update } from '@grammyjs/types'
import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
} from '@nestjs/common'
import { BotService } from './bot.service'

@Controller('bot/webhook')
export class WebhookController {
  public constructor(private botService: BotService) {}

  @Post(':updateToken/update')
  public async update(
    @Param('updateToken') updateToken: string,
    @Body() update: Update,
  ) {
    if (!this.botService.checkUpdateToken(updateToken)) {
      throw new ForbiddenException('invalid token')
    }

    void this.botService.handleUpdate(update)

    return true
  }
}
