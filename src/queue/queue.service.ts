import { QueueMeta, QueueProcessor, QueueTypes } from './meta.types'

export abstract class QueueService {
  public abstract process<T extends QueueTypes>(
    queue: T,
    handler: QueueProcessor<T>,
    concurrency: number,
  ): Promise<void>

  public abstract add<T extends QueueTypes>(
    queue: T,
    data: QueueMeta<T>,
  ): Promise<void>
}
