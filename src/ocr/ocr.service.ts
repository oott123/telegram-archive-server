export abstract class OCRService {
  abstract recognize(image: Uint8Array): Promise<OCRResponse>
}

export type OCRResponse = Array<{
  text: string
  vertices?: Array<{ x: number; y: number }>
  confidence?: number
  rotation?: number
}>
