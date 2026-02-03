---
title: Redis Rate Limiting Analyzer
description: Suggests using RateLimitedWithRedis for job rate limiting when Redis is available
icon: clock
outline: [2, 3]
tags: redis,jobs,queue,rate-limiting,performance
---

# Redis Rate Limiting Analyzer

| Analyzer ID            | Category       | Severity   | Time To Fix  |
| -----------------------| :------------: |:----------:| ------------:|
| `redis-rate-limiting`  | ⚡ Performance  | Low        | 10 minutes   |

## What This Checks

When your application uses Redis, this analyzer suggests using `RateLimitedWithRedis` instead of `RateLimited` middleware for queue jobs to ensure atomic rate limiting across multiple workers.

## Why It Matters

- **Multi-Worker Accuracy:** Standard rate limiting can have race conditions with multiple queue workers
- **Atomic Operations:** Redis-based limiting uses atomic Lua scripts for accurate counting
- **Distributed Queues:** Essential when running multiple queue workers or Horizon
- **Consistent Behavior:** Ensures rate limits are enforced exactly as configured

When multiple queue workers process jobs simultaneously, non-Redis rate limiting can allow bursts beyond your configured limits.

## How to Fix

### Update Job Middleware

**Before (cache-based, potential race conditions):**
```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\Middleware\RateLimited;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    public function middleware(): array
    {
        return [
            new RateLimited('podcasts'),
        ];
    }

    public function handle(): void
    {
        // Process podcast
    }
}
```

**After (Redis-based, atomic operations):**
```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\Middleware\RateLimitedWithRedis;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    public function middleware(): array
    {
        return [
            new RateLimitedWithRedis('podcasts'),
        ];
    }

    public function handle(): void
    {
        // Process podcast
    }
}
```

### Define Rate Limiters

**In `app/Providers/AppServiceProvider.php`:**

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // Rate limiter for podcasts (10 per minute)
    RateLimiter::for('podcasts', function (object $job) {
        return Limit::perMinute(10);
    });

    // Rate limiter with dynamic key
    RateLimiter::for('email', function (object $job) {
        return Limit::perMinute(3)->by($job->user->id);
    });

    // Rate limiter with backoff
    RateLimiter::for('api-calls', function (object $job) {
        return Limit::perMinute(60)
            ->by($job->apiKey)
            ->response(function () {
                // Job will be released back to queue
            });
    });
}
```

### WithoutOverlapping Middleware

If using `WithoutOverlapping` for job locks, ensure your cache driver is Redis:

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

public function middleware(): array
{
    return [
        new WithoutOverlapping($this->user->id),
    ];
}
```

```env
# .env - WithoutOverlapping uses the cache driver
CACHE_DRIVER=redis
```

## Common Rate Limiting Patterns

**Rate limit by user:**
```php
RateLimiter::for('user-actions', function (object $job) {
    return Limit::perMinute(10)->by($job->user->id);
});
```

**Rate limit by external API:**
```php
RateLimiter::for('stripe-api', function (object $job) {
    return Limit::perSecond(25);  // Stripe rate limit
});
```

**Rate limit with release delay:**
```php
public function middleware(): array
{
    return [
        (new RateLimitedWithRedis('api-calls'))->releaseAfterMinutes(5),
    ];
}
```

## Configuration Requirements

Ensure Redis is configured for caching:

```env
# .env
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis  # Recommended when using Redis
```

## How It Works

**RateLimited (cache-based):**
```
Worker 1: READ count → CHECK → WRITE (race window)
Worker 2: READ count → CHECK → WRITE (race window)
```

**RateLimitedWithRedis (atomic Lua script):**
```
Worker 1: INCR + CHECK in single atomic operation
Worker 2: Waits for accurate count from Redis
```

## ShieldCI Configuration

This analyzer:
- Runs in **all environments including CI**
- Skips if Redis is not used by the application
- Scans `app/Jobs` directory for `RateLimited` usage
- Recommends `RateLimitedWithRedis` when Redis is available

## Verification

```bash
# Check job middleware
grep -r "RateLimited" app/Jobs/

# Test rate limiting with Horizon
php artisan horizon

# Monitor in Horizon dashboard
# Jobs should be rate limited consistently
```

## References

- [Laravel Job Middleware Documentation](https://laravel.com/docs/queues#job-middleware)
- [RateLimitedWithRedis Source](https://github.com/laravel/framework/blob/master/src/Illuminate/Queue/Middleware/RateLimitedWithRedis.php)
- [Rate Limiting Configuration](https://laravel.com/docs/routing#rate-limiting)

## Related Analyzers

- [Redis Throttling Analyzer](/analyzers/performance/redis-throttling) - For HTTP request rate limiting
- [Queue Driver Analyzer](/analyzers/performance/queue-driver) - Ensures optimal queue driver
- [Queue Timeout Analyzer](/analyzers/reliability/queue-timeout) - Ensures proper job timeouts
