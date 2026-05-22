---
title: Redis Throttling Analyzer
description: Suggests using ThrottleRequestsWithRedis middleware for more accurate, atomic rate limiting in high-concurrency Laravel applications
icon: zap
outline: [2, 3]
tags: redis,throttling,rate-limiting,middleware,performance
pro: true
---

# Redis Throttling Analyzer

| Analyzer ID         | Category       | Severity   | Time To Fix  |
| --------------------| :------------: |:----------:| ------------:|
| `redis-throttling`  | ⚡ Performance  | Low        | 10 minutes   |

## What This Checks

When your application uses Redis, this analyzer suggests using `ThrottleRequestsWithRedis` instead of the standard `ThrottleRequests` middleware for more accurate rate limiting under high concurrency.

## Why It Matters

- **Atomic Operations:** Redis-based throttling uses atomic Lua scripts for rate limiting
- **Race Condition Prevention:** Standard throttling can allow bursts due to cache read/write race conditions
- **High Concurrency:** More accurate under heavy load when multiple requests arrive simultaneously
- **Distributed Systems:** Works correctly across multiple application servers

The standard `ThrottleRequests` middleware reads the current count, checks if limit is exceeded, then increments. Under high concurrency, multiple requests can read the same count before any increment occurs.

## How to Fix

### Quick Fix (5 minutes)

Update the `throttle` middleware alias to point to the Redis-backed version. All routes using `throttle:60,1` will automatically use atomic rate limiting with no other changes needed.

::: code-group
```php [Laravel 11+]
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->throttleApi(ThrottleRequestsWithRedis::class);
    })
    // ...
```
```php [Laravel 9–10]
protected $middlewareAliases = [
    // Change this:
    // 'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,

    // To this:
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,

    // ... other middleware
];
```
:::

### Proper Fix (10 minutes)

If you need different throttle behaviour per route group — or want to keep the global alias unchanged — apply `ThrottleRequestsWithRedis` explicitly on the routes that require it.

```php
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;

Route::middleware([ThrottleRequestsWithRedis::class.':60,1'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

Ensure Redis is configured as your cache driver:

```ini
CACHE_DRIVER=redis
```

```php
// config/cache.php
'default' => env('CACHE_DRIVER', 'redis'),
```

## References

- [Laravel Rate Limiting Documentation](https://laravel.com/docs/routing#rate-limiting)
- [ThrottleRequestsWithRedis Source](https://github.com/laravel/framework/blob/master/src/Illuminate/Routing/Middleware/ThrottleRequestsWithRedis.php)
- [Redis Lua Scripting](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)

## Related Analyzers

- [Redis Rate Limiting Analyzer](/analyzers/performance/redis-rate-limiting) - For job queue rate limiting
- [Cache Driver Analyzer](/analyzers/performance/cache-driver) - Ensures optimal cache driver
- [Login Throttling Analyzer](/analyzers/security/login-throttling) - Ensures login attempts are throttled
