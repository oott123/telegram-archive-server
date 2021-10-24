import { Injectable } from '@nestjs/common'
import { Job } from 'bull'
import {
  OCRMeta,
  MessageMeta,
  QueueProcessor,
  QueueMeta,
  QueueTypes,
} from './meta.types'
import { QueueService } from './queue.service'

@Injectable()
export class MemoryQueueService implements QueueService {
  private processors = new Map<QueueTypes, QueueProcessor<any>>()

  public async process<T extends keyof { ocr: OCRMeta; message: MessageMeta }>(
    queue: T,
    handler: QueueProcessor<T>,
    concurrency: number,
  ): Promise<void> {
    this.processors.set(queue, handler)
  }

  public async add<T extends keyof { ocr: OCRMeta; message: MessageMeta }>(
    queue: T,
    data: QueueMeta<T>,
  ): Promise<void> {
    const processor = this.processors.get(queue)
    if (!processor) {
      throw new Error(`Queue ${queue} processor not found`)
    }
    await processor(data)
  }
}
