import { registerAs } from '@nestjs/config'

export default registerAs('http', () => ({
  baseUrl: process.env.HTTP_BASE_URL || '',
  uiUrl: process.env.HTTP_UI_URL || '',
  host: process.env.HTTP_HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1'),
  port: process.env.HTTP_PORT || process.env.PORT || 3100,
  jwtSecret: process.env.HTTP_JWT_SECRET || '',
  globalPrefix: '/api/v1',
}))
