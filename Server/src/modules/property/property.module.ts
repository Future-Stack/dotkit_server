import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { ExternalApisModule } from '../external-apis/external-apis.module';

@Module({
  imports: [ExternalApisModule],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}

