import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhopController } from './whop.controller';
import { WhopService } from './whop.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [WhopController],
  providers: [WhopService],
  exports: [WhopService],
})
export class WhopModule {}
