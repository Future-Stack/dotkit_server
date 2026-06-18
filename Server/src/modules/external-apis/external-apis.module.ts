import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalApisService } from './external-apis.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  providers: [ExternalApisService],
  exports: [ExternalApisService],
})
export class ExternalApisModule {}
