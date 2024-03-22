import { Module } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import ocrConfig from 'src/config/ocr.config'
import { GoogleOCRService } from './google-ocr.service'
import { OCRService } from './ocr.service'
import { PaddleOCRWebService } from './paddle-ocr-web.service'
import { AzureOCRService } from './azure-ocr.service'

@Module({
  providers: [
    {
      provide: OCRService,
      useFactory: (
        moduleRef: ModuleRef,
        ocrCfg: ConfigType<typeof ocrConfig>,
      ) => {
        if (!ocrCfg.enable) {
          return null
        }
        if (ocrCfg.driver === 'google') {
          return moduleRef.create(GoogleOCRService)
        } else if (ocrCfg.driver === 'paddle-ocr-web') {
          return moduleRef.create(PaddleOCRWebService)
        } else if (ocrCfg.driver === 'azure') {
          return moduleRef.create(AzureOCRService)
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const module = require(`tas-ocr-driver-${ocrCfg.driver}`)
          return moduleRef.create(module.OCRService)
        } catch (e) {
          console.error('====>> Failed to get OCR driver: ' + ocrCfg.driver)
          throw e
        }
      },
      inject: [ModuleRef, ocrConfig.KEY],
    },
  ],
  exports: [OCRService],
})
export class OCRModule {}
