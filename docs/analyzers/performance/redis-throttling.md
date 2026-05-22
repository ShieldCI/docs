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

When your application uses Redis, this analyzer suggests using `ThrottleRequestsWithRedis` instead of the standard `ThrottleRequests` middleware for more accurate rate limiting under high concurrency. Checks for:

- `ThrottleRequests` middleware registered in global middleware when Redis is available
- The `throttle` alias mapped to `ThrottleRequests` instead of `ThrottleRequestsWithRedis`
- Routes using the non-Redis throttle middleware

## Why It Matters

- **Atomic Operations:** Redis-based throttling uses atomic Lua scripts for rate limiting
- **Race Condition Prevention:** Standard throttling can allow bursts due to cache read/write race conditions
- **High Concurrency:** More accurate under heavy load when multiple requests arrive simultaneously
- **Distributed Systems:** Works correctly across multiple application servers

The standard `ThrottleRequests` middleware reads the current count, checks if the limit is exceeded, then increments — three separate cache operations. Under high concurrency, multiple requests can read the same count before any increment occurs, allowing brief bursts past the configured limit.

## How to Fix

### Quick Fix

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->throttleWithRedis();
    // ...
})
```
```php [Laravel 9–10]
// app/Http/Kernel.php
protected $middlewareAliases = [
    // Change this:
    // 'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,

    // To this:
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,

    // ... other aliases
];
```
:::

`throttleWithRedis()` remaps the `throttle` alias to `ThrottleRequestsWithRedis`. All routes using `throttle:60,1` will automatically use atomic rate limiting with no other changes needed.

::: warning Alias override pitfall
On Laravel 11+, calling `$middleware->throttleWithRedis()` and then passing `'throttle' => ThrottleRequests::class` to `$middleware->alias()` in the same `withMiddleware()` block will override the Redis mapping. Remove the explicit `throttle` entry from `alias()` when using `throttleWithRedis()`.
:::

### Explicit per-route middleware

If you need different throttle behaviour per route group without changing the global alias, apply `ThrottleRequestsWithRedis` directly:

```php
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;

Route::middleware([ThrottleRequestsWithRedis::class.':60,1'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

### Prerequisites

Ensure Redis is configured as your cache driver:

```ini
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
