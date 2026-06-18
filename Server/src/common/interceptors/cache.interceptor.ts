import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';


import type { Cache } from 'cache-manager';

import { CACHE_MANAGER } from '@nestjs/cache-manager';

/**
 * Cache Interceptor
 * Caches GET requests automatically
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,  
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key
    const cacheKey = `cache:${url}`;

    // Try to get from cache
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse !== undefined) {
      return of(cachedResponse);
    }

    // Execute request and cache response
    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Modern cache-manager expects seconds for TTL in most stores
          await this.cacheManager.set(cacheKey, response, 300); // 5 minutes
        } catch (err) {
          console.warn(`Failed to cache response for ${cacheKey}`, err);
        }
      }),
    );
  }
}