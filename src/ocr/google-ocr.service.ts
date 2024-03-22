import { OCRService, OCRResponse } from './ocr.service'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import { Inject, Injectable } from '@nestjs/common'
import ocrConfig from '../config/ocr.config'
import { ConfigType } from '@nestjs/config'

@Injectable()
export class GoogleOCRService implements OCRService {
  private client!: ImageAnnotatorClient

  public constructor(
    @Inject(ocrConfig.KEY) ocrCfg: ConfigType<typeof ocrConfig>,
  ) {
    this.client = new ImageAnnotatorClient({ apiEndpoint: ocrCfg.endpoint })
  }

  public async recognize(image: Uint8Array): Promise<OCRResponse> {
    const imgBuffer = image instanceof Buffer ? image : Buffer.from(image)
    const detectResult = await this.client.textDetection(imgBuffer)
    const { fullTextAnnotation } = detectResult[0]
    if (!fullTextAnnotation?.text) {
      return []
    }
    return [{ text: fullTextAnnotation.text }]
  }
}
