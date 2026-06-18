import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Service Marketplace App Server Runing Success!';
  }
}
