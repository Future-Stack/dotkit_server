import { Body, Controller, Post } from '@nestjs/common';
import { Section8Service } from './section-8.service';
import { Section8RequestDto } from './dto/request.demo';

@Controller('section-8')
export class Section8Controller {
  constructor(private readonly section8Service: Section8Service) {}

  @Post("section-nine")
  async sectionNine(@Body() dto : Section8RequestDto){
    return dto
  }

}
