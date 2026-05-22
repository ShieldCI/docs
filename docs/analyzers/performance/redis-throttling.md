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

### Option 1: Update Middleware Alias (Recommended)

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

All routes using `throttle:60,1` will now use the Redis version automatically.

### Option 2: Use Explicit Middleware on Routes

```php
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;

// In routes/api.php
Route::middleware([ThrottleRequestsWithRedis::class.':60,1'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

**Configuration Requirements**

Ensure Redis is your cache driver:

```env
# .env
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
