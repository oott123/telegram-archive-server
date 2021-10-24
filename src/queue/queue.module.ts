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
      useFactory: async (
        moduleRef: ModuleRef,
        queueCfg: ConfigType<typeof queueConfig>,
      ) => {
        if (queueCfg.enable) {
          return await moduleRef.create(BullQueueService)
        } else {
          return await moduleRef.create(MemoryQueueService)
        }
      },
      inject: [ModuleRef, queueConfig.KEY],
    },
  ],
  exports: [QueueService],
})
export class QueueModule {}
