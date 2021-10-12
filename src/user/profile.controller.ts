import {
  Controller,
  Get,
  NotFoundException,
  Param,
  StreamableFile,
  Response,
} from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { BotService } from 'src/bot/bot.service'

@Controller('profile')
export class ProfileController {
  constructor(private botService: BotService) {}

  @Get('/:userId/photo')
  async getProfilePhoto(
    @Param('userId') userId: string,
    @Response({ passthrough: true }) res: FastifyReply,
  ) {
    userId = userId.replace(/^user/, '')
    res.header('Cache-Control', 'public, max-age=86400')

    const photo = await this.botService.getProfilePhoto(Number(userId))
    if (!photo) {
      throw new NotFoundException('photo not found')
    }

    res.header('Content-Type', 'image/jpeg')

    return new StreamableFile(photo.body as any)
  }
}
