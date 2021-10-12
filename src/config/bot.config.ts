import { registerAs } from '@nestjs/config'

export default registerAs('bot', () => ({
  token: process.env.TELEGRAM_BOT_TOKEN || '',
  webhook: process.env.TELEGRAM_WEBHOOK === 'true',
  followEdit: process.env.TELEGRAM_FOLLOW_EDIT === 'true',
  followDelete: process.env.TELEGRAM_FOLLOW_DELETE === 'true',
  updateToken: process.env.TELEGRAM_WEBHOOK_UPDATE_TOKEN || '',
}))
