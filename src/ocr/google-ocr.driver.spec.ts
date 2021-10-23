import { GoogleOCRDriver } from './google-ocr.driver'
import { readFile } from 'fs/promises'

let googleOcr: GoogleOCRDriver
let image: Buffer

beforeEach(async () => {
  googleOcr = new GoogleOCRDriver()
  await googleOcr.config('eu-vision.googleapis.com')
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
