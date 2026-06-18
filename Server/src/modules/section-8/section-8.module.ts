import { Module } from '@nestjs/common';
import { Section8Service } from './section-8.service';
import { Section8Controller } from './section-8.controller';

@Module({
  controllers: [Section8Controller],
  providers: [Section8Service],
})
export class Section8Module {}
