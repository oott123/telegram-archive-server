import { GoogleOCRService } from './google-ocr.service'
import { readFile } from 'fs/promises'

let googleOcr: GoogleOCRService
let image: Buffer

beforeEach(async () => {
  googleOcr = new GoogleOCRService({
    enable: true,
    driver: 'google',
    endpoint: 'eu-vision.googleapis.com',
    credentials: '',
  })
  image = await readFile('docs/assets/search-ui.jpg')
})

test('simple ocr', async () => {
  const result = await googleOcr.recognize(image)
  const texts = result.map((x) => x.text).join('\n')
  expect(texts).toContain('搜索界面')
  expect(texts).toContain('Telegram')
  expect(texts).toContain('Archive')
  expect(texts).toContain('Server')
  expect(texts).toContain('宣传图')
})
