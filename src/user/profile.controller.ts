import {
  Controller,
  Get,
  Param,
  CacheTTL,
  UseInterceptors,
  CacheInterceptor,
  Header,
} from '@nestjs/common'
import { BotService } from '../bot/bot.service'

@Controller('profile')
export class ProfileController {
  constructor(private botService: BotService) {}

  @Get('/:userId/photo')
  @CacheTTL(3600)
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', 'public, max-age=86400')
  @Header('Content-Type', 'image/jpeg')
  async getProfilePhoto(@Param('userId') userId: string) {
    userId = userId.replace(/^user/, '')

    const photo = await this.botService.getProfilePhoto(Number(userId))
    if (!photo) {
      return Buffer.from([])
    }

    return await photo.buffer()
  }
}
