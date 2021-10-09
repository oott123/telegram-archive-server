import { registerAs } from '@nestjs/config'

export default registerAs('meilisearch', () => ({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
  indexPrefix: process.env.MEILISEARCH_INDEX_PREFIX || '',
}))
