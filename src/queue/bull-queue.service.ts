import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import queueConfig from '../config/queue.config'
import Queue = require('bull')
import Debug from 'debug'
import { QueueMeta, QueueProcessor, QueueTypes } from './meta.types'
import { QueueService } from './queue.service'

const debug = Debug('app:queue:bull')

@Injectable()
export class BullQueueService implements OnModuleDestroy, QueueService {
  private readonly queueMap: Map<QueueTypes, Queue.Queue<QueueMeta>>

  constructor(
    @Inject(queueConfig.KEY) queueCfg: ConfigType<typeof queueConfig>,
  ) {
    this.queueMap = new Map()
    for (const key of ['ocr', 'message'] as const) {
      this.setQueue(
        key,
        new Queue(key, {
          redis: queueCfg.redis,
          prefix: queueCfg.redis.keyPrefix,
        }),
      )
    }
  }

  private setQueue<T extends QueueTypes>(
    key: T,
    queue: Queue.Queue<QueueMeta<T>>,
  ) {
    this.queueMap.set(key, queue)
  }

  private getQueue<T extends QueueTypes>(key: T): Queue.Queue<QueueMeta<T>> {
    if (!this.queueMap.has(key)) {
      throw new Error(`queue ${key} not found`)
    }
    return this.queueMap.get(key) as Queue.Queue<QueueMeta<T>>
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
    debug(`setup process handler for queue ${queue}`, handler)
    await this.getQueue(queue).process(concurrency, (job, done) => {
      const debug = Debug(`app:queue:bull:${queue}:${job.id}`)
      debug(`running`, job.data)
      handler(job.data).then(
        () => {
          debug('finished')
          done()
        },
        (err) => {
          debug('error', err)
          done(err)
        },
      )
    })
  }

  public async add<T extends QueueTypes>(
    queue: T,
    data: QueueMeta<T>,
  ): Promise<void> {
    debug(`adding job to queue ${queue}`)
    await this.getQueue(queue).add(data)
  }
}
