import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import queueConfig from '../config/queue.config'
import { Queue, Worker } from 'bullmq'
import Debug from 'debug'
import { QueueMeta, QueueProcessor, QueueTypes } from './meta.types'
import { QueueService } from './queue.service'

const debug = Debug('app:queue:bull')

@Injectable()
export class BullQueueService implements OnModuleDestroy, QueueService {
  private readonly queueMap: Map<QueueTypes, Queue<QueueMeta>>
  private readonly workerMap: Map<QueueTypes, Worker<QueueMeta>>
  private readonly redisOptions: ConfigType<typeof queueConfig>['redis']
  private readonly redisKeyPrefix: string

  public constructor(
    @Inject(queueConfig.KEY) queueCfg: ConfigType<typeof queueConfig>,
  ) {
    this.queueMap = new Map()
    this.workerMap = new Map()
    this.redisOptions = queueCfg.redis
    this.redisKeyPrefix = queueCfg.keyPrefix
    for (const key of ['ocr', 'message'] as const) {
      this.setQueue(
        key,
        new Queue(key, {
          connection: this.redisOptions,
          prefix: this.redisKeyPrefix,
        }),
      )
    }
  }

  private setQueue<T extends QueueTypes>(key: T, queue: Queue<QueueMeta<T>>) {
    this.queueMap.set(key, queue)
  }

  private getQueue<T extends QueueTypes>(key: T): Queue<QueueMeta<T>> {
    if (!this.queueMap.has(key)) {
      throw new Error(`queue ${key} not found`)
    }
    return this.queueMap.get(key) as Queue<QueueMeta<T>>
  }

  public async onModuleDestroy() {
    for (const key of this.queueMap.keys()) {
      await this.getQueue(key).close()
    }
  }

  public async process<T extends QueueTypes>(
    queue: T,
    handler: QueueProcessor<T>,
    concurrency = 1,
  ) {
    debug(
      `setup process handler for queue ${queue} with concurrency ${concurrency}`,
      handler,
    )
    if (!this.queueMap.has(queue)) {
      throw new Error(`Unknown queue ${queue}`)
    }
    if (this.workerMap.has(queue)) {
      throw new Error(`Already has worker for queue ${queue}`)
    }

    const worker = new Worker<QueueMeta<T>>(
      queue,
      async (job) => {
        const debug = Debug(`app:queue:bull:${queue}:${job.id}`)
        debug(`running`)
        try {
          await handler(job.data)
          debug('finished')
        } catch (err) {
          debug('error', err)
          throw err
        }
      },
      {
        concurrency,
        connection: this.redisOptions,
        prefix: this.redisKeyPrefix,
      },
    )

    this.workerMap.set(queue, worker)
  }

  public async add<T extends QueueTypes>(
    queue: T,
    data: QueueMeta<T>,
  ): Promise<void> {
    debug(`adding job to queue ${queue}`)
    await this.getQueue(queue).add(queue, data)
  }
}
