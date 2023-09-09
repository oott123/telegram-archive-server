import { OCRService, OCRResponse } from './ocr.service'
import { Inject, Injectable } from '@nestjs/common'
import ocrConfig from 'src/config/ocr.config'
import { ConfigType } from '@nestjs/config'
import Debug from 'debug'

const debug = Debug('app:ocr:paddle-ocr-web')

@Injectable()
export class PaddleOCRWebService implements OCRService {
  private endpoint: string

  public constructor(
    @Inject(ocrConfig.KEY) ocrCfg: ConfigType<typeof ocrConfig>,
  ) {
    this.endpoint = ocrCfg.endpoint!
    debug('init paddle-ocr-web with endpoint', this.endpoint)
  }

  public async recognize(image: Uint8Array): Promise<OCRResponse> {
    const imgBuffer = image instanceof Buffer ? image : Buffer.from(image)
    const imgBlob = new Blob([imgBuffer])

    const form = new FormData()
    form.append('lang', 'zh-Hans')
    form.append('file', imgBlob)

    debug('uploading file to paddle-ocr-web')
    const res = await (
      await fetch(this.endpoint, {
        method: 'POST',
        body: form,
      })
    ).json()

    debug('paddle-ocr-web response', res?.result)
    const textParts = [] as OCRResponse

    if (Array.isArray(res.result)) {
      for (const item of res.result) {
        textParts.push({
          text: item[1][0],
          vertices: item[0].map((v: [number, number]) => ({
            x: v[0],
            y: v[1],
          })),
          confidence: item[1][1],
        })
      }
    }

    return textParts
  }
}
