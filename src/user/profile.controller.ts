import {
  Controller,
  Get,
  Param,
  Header,
  Inject,
  CACHE_MANAGER,
} from '@nestjs/common'
import { Cache } from 'cache-manager'
import { BotService } from '../bot/bot.service'

@Controller('profile')
export class ProfileController {
  constructor(
    private botService: BotService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  @Get('/:userId/photo')
  @Header('Cache-Control', 'public, max-age=86400')
  @Header('Content-Type', 'image/jpeg')
  async getProfilePhoto(@Param('userId') userId: string) {
    userId = userId.replace(/^user/, '')
    const cacheKey = `photo_${userId}`
    const cached = await this.cache.get<string>(cacheKey)
    if (cached) {
      return Buffer.from(cached, 'base64')
    }

    const photo = await this.botService.getProfilePhoto(Number(userId))
    const buf = photo ? await photo.buffer() : Buffer.from([])
    this.cache.set(cacheKey, buf).catch(console.error)
    return buf
  }
}
