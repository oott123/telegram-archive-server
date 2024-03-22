import { AzureOCRService } from './azure-ocr.service'
import { readFile } from 'fs/promises'

let azureOCR: AzureOCRService
let image: Buffer

beforeEach(async () => {
  azureOCR = new AzureOCRService({
    enable: true,
    driver: 'azure',
    endpoint: process.env.AZURE_ENDPOINT,
    credentials: process.env.AZURE_CREDENTIALS,
  })
  image = await readFile('docs/assets/search-ui.jpg')
})

test('simple ocr', async () => {
  const result = await azureOCR.recognize(image)
  const texts = result.map((x) => x.text).join('\n')
  expect(texts).toContain('搜索界面')
  expect(texts).toContain('Telegram')
  expect(texts).toContain('Archive')
  expect(texts).toContain('Server')
  expect(texts).toContain('宣传图')
})
