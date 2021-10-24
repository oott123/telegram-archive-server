import { Injectable } from '@nestjs/common'
import { OCRService } from 'src/ocr/ocr.service'
import { QueueProcessor } from 'src/queue/meta.types'
import { QueueService } from 'src/queue/queue.service'
import { OptionalTextMessageIndex } from './meili-search.service'
import Debug from 'debug'

const debug = Debug('app:search:image-index')

@Injectable()
export class ImageIndexService {
  public constructor(private queue: QueueService, private ocr: OCRService) {}

  public async indexImage(
    images: Buffer[],
    message: OptionalTextMessageIndex,
  ): Promise<void> {
    if (!this.ocr) {
      return
    }
    await this.queue.add('ocr', {
      images: images.map((b) => ({
        type: 'base64',
        data: b.toString('base64'),
      })),
      message,
    })
  }

  public async startHandleOCR() {
    await this.queue.process('ocr', this.handleOCR)
  }

  private handleOCR: QueueProcessor<'ocr'> = async ({ images, message }) => {
    if (!this.ocr) {
      return
    }
    const textList = [message.text]
    const ocrRaw: any[] = []
    for (const image of images) {
      if (image.type !== 'base64') {
        throw new Error('TODO')
      }
      const buf = Buffer.from(image.data, 'base64')
      debug(`getting image buffer, size ${buf.length}`, buf)

      const ocrResult = await this.ocr.recognize(buf)
      ocrRaw.push(ocrResult)

      const text = ocrResult.map((x) => x.text).join('\n')
      textList.push(text)
    }
    await this.queue.add('message', {
      message: {
        ...message,
        text: textList.filter((x) => x).join('\n'),
        ocr: ocrRaw,
      },
    })
  }
}
