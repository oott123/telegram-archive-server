import { registerAs } from '@nestjs/config'

export default registerAs('http', () => ({
  baseUrl: process.env.HTTP_BASE_URL || '',
  port: Number(process.env.HTTP_PORT || process.env.PORT || 3100),
  globalPrefix: '/api/v1',
}))
