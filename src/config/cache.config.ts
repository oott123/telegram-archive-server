import { registerAs } from '@nestjs/config'

export default registerAs('cache', () => ({
  cacheStore: process.env.CACHE_STORE || 'memory',
  redis: {
    host: process.env.CACHE_REDIS_HOST || 'localhost',
    port: Number(process.env.CACHE_REDIS_PORT || 6379),
    password: process.env.CACHE_REDIS_PASSWORD,
    db: Number(process.env.CACHE_REDIS_DB || 0),
  },
  ttl: 0,
}))
