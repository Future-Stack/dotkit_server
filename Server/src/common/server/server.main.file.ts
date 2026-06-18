import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as net from 'net';
import rateLimit from 'express-rate-limit';
import { Redis } from 'ioredis';

let apm: any;
try {
    apm = require('elastic-apm-node');
} catch { }

let RedisStore: any;
try {
    RedisStore = require('rate-limit-redis');
} catch { }


export async function getAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const tryPort = (port: number) => {
            const server = net.createServer();
            server.once('error', (err: NodeJS.ErrnoException) => {
                if (err.code === 'EADDRINUSE') {
                    attempts++;
                    if (attempts >= maxAttempts) reject(err);
                    else tryPort(port + 1);
                } else reject(err);
            });
            server.once('listening', () => {
                server.close();
                resolve(port);
            });
            server.listen(port);
        };
        tryPort(startPort);
    });
}

export function initializeAPM(configService: ConfigService, nodeEnv: string): void {
    if (nodeEnv === 'production' && apm) {
        const apmServerUrl = configService.get('APM_SERVER_URL');
        const apmSecretToken = configService.get('APM_SECRET_TOKEN');
        if (apmServerUrl && apmSecretToken) {
            apm.start({
                serviceName: 'service-marketplace-api',
                secretToken: apmSecretToken,
                serverUrl: apmServerUrl,
                environment: nodeEnv,
                active: true,
            });
        }
    }
}

export function setupInMemoryRateLimiting(app: any, windowMs: number, max: number) {
    app.use(
        rateLimit({
            windowMs,
            max,
            skip: (req: any) =>
                ['/health', '/metrics', '/docs'].some(p => req.url.includes(p)),
        }),
    );
}

export function setupRateLimiting(app: any, configService: ConfigService, nodeEnv: string): void {
    if (nodeEnv !== 'production') return;

    const windowMs = configService.get<number>('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
    const max = configService.get<number>('RATE_LIMIT_MAX', 100);
    const redisUrl = configService.get('REDIS_URL');

    if (redisUrl && RedisStore) {
        const redisClient = new Redis(redisUrl);
        app.use(
            rateLimit({
                windowMs,
                max,
                store: new RedisStore({ client: redisClient }),
                skip: (req: any) =>
                    ['/health', '/metrics', '/docs'].some(p => req.url.includes(p)),
            }),
        );
    } else {
        setupInMemoryRateLimiting(app, windowMs, max);
    }
}

export function setupSecurity(app: any, configService: ConfigService, nodeEnv: string): void {
    app.use(helmet({ contentSecurityPolicy: nodeEnv === 'production' ? undefined : false }));
    app.enableCors({
        origin: true,
        credentials: true
    });
}

export function setupRequestLogging(app: any, logger: Logger): void {
    app.use((req: any, res: any, next: any) => {
        const start = Date.now();
        res.on('finish', () => {
            logger.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
        });
        next();
    });
}

export function setupSwagger(app: any, nodeEnv: string, port: number): void {
    if (nodeEnv === 'production') return;

    const config = new DocumentBuilder()
        .setTitle('InvestoMetrics Backend API')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    new Logger('Swagger').log(`Swagger: http://localhost:${port}/docs`);
}