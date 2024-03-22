import type { OCRService, OCRResponse } from './ocr.service'
import { Inject, Injectable } from '@nestjs/common'
import ocrConfig from '../config/ocr.config'
import { ConfigType } from '@nestjs/config'
import Debug from 'debug'
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision'
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js'

const debug = Debug('app:ocr:azure')

@Injectable()
export class AzureOCRService implements OCRService {
  private client: ComputerVisionClient

  public constructor(
    @Inject(ocrConfig.KEY) ocrCfg: ConfigType<typeof ocrConfig>,
  ) {
    const credentials = new CognitiveServicesCredentials(ocrCfg.credentials!)
    const client = new ComputerVisionClient(credentials, ocrCfg.endpoint!)
    this.client = client

    debug('init azure vision')
  }

  public async recognize(image: Uint8Array): Promise<OCRResponse> {
    const imgBuffer = image instanceof Buffer ? image : Buffer.from(image)

    debug('uploading file to azure vision')
    const request = await this.client.readInStream(imgBuffer, {
      readingOrder: 'natural',
    })
    debug('read request finished', request._response)

    const results = await (async () => {
      const totalTimes = 30
      for (let i = 0; i < totalTimes; i++) {
        await new Promise((r) => setTimeout(r, 500))

        const result = await this.client.getReadResult(
          request._response.parsedHeaders.operationLocation?.match(
            /[^/]+$/,
          )![0],
        )
        if (result._response.parsedBody.status === 'running') {
          debug(`task running ${i + 1}/${totalTimes}...`)
          continue
        }

        if (result._response.parsedBody.status === 'succeeded') {
          debug('task success')
          return result._response.parsedBody.analyzeResult?.readResults
        }

        throw new Error('failed to recognize')
      }
      throw new Error('task timeout')
    })()

    const textParts = [] as OCRResponse

    if (results) {
      for (const page of results) {
        for (const line of page.lines) {
          textParts.push({
            text: line.text,
            vertices: chunk(line.boundingBox, 2).map(([x, y]) => ({ x, y })),
          })
        }
      }
    }

    return textParts
  }
}

function chunk<T>(array: T[], size): T[][] {
  const chunkedArray = [] as T[][]
  for (let i = 0; i < array.length; i += size) {
    chunkedArray.push(array.slice(i, i + size))
  }
  return chunkedArray
}
