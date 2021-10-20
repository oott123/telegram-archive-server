import {
  Controller,
  Get,
  Param,
  Header,
  Inject,
  CACHE_MANAGER,
} from '@nestjs/common'
import { Cache } from 'cache-manager'
import { join } from 'path'
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
    const buf = photo ? await photo.buffer() : this.getDefaultPhoto()
    this.cache.set(cacheKey, buf, { ttl: 3600 }).catch(console.error)
    return buf
  }

  getDefaultPhoto() {
    return Buffer.from(
      'R0lGODlhgACAAPEAAF+81v///5vW5tLt9CH5BAAAAAAALAAAAACAAIAAAAL+hI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8YhMKpfMpvMJjUqn1IpAMMAOAoNuVlAdXbeBsvls7oY5V7T7fR6sL2S4/X2dQ7D3vl2ux8DnR4gXmFBXqBh3aJC4CMl1GEkZB7ZWmVkGWKXpySn16Bl5GSUwOlr6JIoaGcXaCgnKFDs6qwRbu6iKqzvadOrryXuU+2bc50V4WxTsl9dGeul8R+u3AIndR0xEDcftfQe+rRSOxuy43GCMLoTcjry5ftcehMxtYO6GD6Avn/Runh949HqJa+CPkaCCAK8xUNQgmcGDChKeW2CxHpD+eAF4WdyX4KPGHxyzHBi0iNNHSQ0VcWw10sdLYRJb0tQUs8fMm3By8uD5aSLQSD53DM1UVMfOo2eUMK2UZOVTN06nQuL3Q6pVM1G37kKy1CpWmV4XISnr8ohWtGN3rC2btAbalM3mmu1mN+2QsHCHvLXrNy/dIIKzAfmbt+0MxIKzFibl4zHRHowLK3ZR+bFbyZXiouCc6bIKvqBZ1iBduqMN1KlPp8ZJ4/UwGbKDxmBdm3YlaP1wp4GmhZLnD2u/COzMDyUh0SQ45oFAOudL19+Y9zZcoUvPG8G7PMew0qQGL1vEhxlD3rv1Ruzbu38PP778+fTr27+PP7/+/fwT+/v/D2CAAg5IYIEGHohggjUUAAA7',
      'base64',
    )
  }
}
