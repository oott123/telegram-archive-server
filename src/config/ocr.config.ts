import { registerAs } from '@nestjs/config'

export default registerAs('ocr', () => ({
  enable: process.env.OCR_ENABLE === 'true',
  driver: process.env.OCR_DRIVER || 'google',
  endpoint: process.env.OCR_ENDPOINT,
  credentials: process.env.OCR_CREDENTIALS,
}))
