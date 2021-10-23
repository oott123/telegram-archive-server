import { registerAs } from '@nestjs/config'

export default registerAs('queue', () => ({
  enable: process.env.QUEUE_ENABLE === 'true',
  amqpUrl: process.env.QUEUE_AMQP_URL || 'amqp://guest@localhost',
}))
