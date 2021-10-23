export interface OCRDriverInterface {
  config(endpoint: string, credentials: string): Promise<void>
  recognize(image: Uint8Array): Promise<OCRResponse>
}

export type OCRResponse = Array<{
  text: string
  vertices?: Array<{ x: number; y: number }>
  confidence?: number
  rotation?: number
}>
