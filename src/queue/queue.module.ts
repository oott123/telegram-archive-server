import { Module } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import queueConfig from 'src/config/queue.config'
import { BullQueueService } from './bull-queue.service'
import { MemoryQueueService } from './memory-queue.service'
import { QueueService } from './queue.service'

@Module({
  providers: [
    {
      provide: QueueService,
      useFactory: (
        moduleRef: ModuleRef,
        queueCfg: ConfigType<typeof queueConfig>,
      ) => {
        if (queueCfg.enable) {
          return moduleRef.get(BullQueueService)
        } else {
          return moduleRef.get(MemoryQueueService)
        }
      },
      inject: [ModuleRef, queueConfig.KEY],
    },
  ],
})
export class QueueModule {}
