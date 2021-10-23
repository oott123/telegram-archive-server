import { OCRDriverInterface, OCRResponse } from './ocr-driver.interface'
import { ImageAnnotatorClient } from '@google-cloud/vision'

export class GoogleOCRDriver implements OCRDriverInterface {
  private client!: ImageAnnotatorClient

  async config(endpoint: string): Promise<void> {
    this.client = new ImageAnnotatorClient({ apiEndpoint: endpoint })
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
