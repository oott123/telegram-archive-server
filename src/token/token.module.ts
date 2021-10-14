import { Module } from '@nestjs/common'
import { TokenService } from './token.service'

@Module({
  exports: [TokenService],
  providers: [TokenService],
})
export class TokenModule {}
