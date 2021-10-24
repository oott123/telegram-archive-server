import { registerAs } from '@nestjs/config'

export default registerAs('queue', () => ({
  enable: process.env.QUEUE_ENABLE === 'true',
  redis: {
    host: process.env.QUEUE_REDIS_HOST || 'localhost',
    port: Number(process.env.QUEUE_REDIS_PORT || 6379),
    password: process.env.QUEUE_REDIS_PASSWORD,
    db: Number(process.env.QUEUE_REDIS_DB || 0),
    keyPrefix: process.env.QUEUE_REDIS_KEY_PREFIX || '',
  },
}))
