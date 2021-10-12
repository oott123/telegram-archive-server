import type { Update } from '@grammyjs/types'
import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
} from '@nestjs/common'
import { GrammyService } from './grammy.service'

@Controller('webhook')
export class WebhookController {
  constructor(private grammyService: GrammyService) {}

  @Post(':updateToken/update')
  public async update(
    @Param('updateToken') updateToken: string,
    @Body() update: Update,
  ) {
    if (!this.grammyService.checkUpdateToken(updateToken)) {
      throw new ForbiddenException('invalid token')
    }

    void this.grammyService.handleUpdate(update)

    return true
  }
}
