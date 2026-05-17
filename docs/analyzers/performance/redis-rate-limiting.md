---
title: Redis Rate Limiting Analyzer
description: Suggests using RateLimitedWithRedis for job rate limiting when Redis is available
icon: zap
outline: [2, 3]
tags: redis,jobs,queue,rate-limiting,performance
pro: true
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

### Quick Fix (5 minutes)

Replace `RateLimited` with `RateLimitedWithRedis` in each job's `middleware()` method:

**Before (❌):**
```php
use Illuminate\Queue\Middleware\RateLimited;

public function middleware(): array
{
    return [new RateLimited('podcasts')];
}
```

**After (✅):**
```php
use Illuminate\Queue\Middleware\RateLimitedWithRedis;

public function middleware(): array
{
    return [new RateLimitedWithRedis('podcasts')];
}
```

### Proper Fix (10 minutes)

Define named rate limiters centrally in `AppServiceProvider`, then apply `RateLimitedWithRedis` to all affected jobs:

**`app/Providers/AppServiceProvider.php`:**
```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('podcasts', function (object $job) {
        return Limit::perMinute(10);
    });

    RateLimiter::for('email', function (object $job) {
        return Limit::perMinute(3)->by($job->user->id);
    });
}
```

**Each affected job:**
```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Middleware\RateLimitedWithRedis;

class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    public function middleware(): array
    {
        return [new RateLimitedWithRedis('podcasts')];
    }

    public function handle(): void { /* ... */ }
}
```

If you also use `WithoutOverlapping`, ensure Redis is your cache driver for reliable distributed locks:

```env
# Laravel 11+
CACHE_STORE=redis
# Laravel 10 and below
CACHE_DRIVER=redis
```

## References

- [Laravel Job Middleware Documentation](https://laravel.com/docs/queues#job-middleware)
- [RateLimitedWithRedis Source](https://github.com/laravel/framework/blob/master/src/Illuminate/Queue/Middleware/RateLimitedWithRedis.php)
- [Queue Rate Limiting](https://laravel.com/docs/queues#rate-limiting)

## Related Analyzers

- [Redis Throttling Analyzer](/analyzers/performance/redis-throttling) - For HTTP request rate limiting
- [Queue Driver Analyzer](/analyzers/performance/queue-driver) - Ensures optimal queue driver
- [Queue Timeout Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures proper job timeouts
