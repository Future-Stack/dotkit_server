import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';
import { getAvailablePort, initializeAPM, setupRateLimiting, setupRequestLogging, setupSecurity, setupSwagger } from './common/server/server.main.file';


export async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV', 'development');

  initializeAPM(configService, nodeEnv);

  const port = await getAvailablePort(configService.get<number>('PORT', 3000));

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  setupSecurity(app, configService, nodeEnv);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  setupRateLimiting(app, configService, nodeEnv);
  setupRequestLogging(app, logger);
  setupSwagger(app, nodeEnv, port);

  const server = await app.listen(port, '0.0.0.0');

  logger.log(`App: http://localhost:${port}`);
  logger.log(`API: http://localhost:${port}/api/v1`);
  logger.log(`Docs: http://localhost:${port}/docs`);

  const shutdown = async () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 30000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
