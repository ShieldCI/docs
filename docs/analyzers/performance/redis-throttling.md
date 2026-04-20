---
title: Redis Throttling Analyzer
description: Suggests using ThrottleRequestsWithRedis for more accurate rate limiting
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

**Laravel 10 and below — In `app/Http/Kernel.php`:**

```php
protected $middlewareAliases = [
    // Change this:
    // 'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,

    // To this:
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,

    // ... other middleware
];
```

**Laravel 11+ — In `bootstrap/app.php`:**

```php
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->throttleApi(ThrottleRequestsWithRedis::class);
    })
    // ...
```

All routes using `throttle:60,1` will now use the Redis version automatically.

### Option 2: Use Explicit Middleware on Routes

```php
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;

// In routes/api.php
Route::middleware([ThrottleRequestsWithRedis::class.':60,1'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

### Configuration Requirements

Ensure Redis is your cache driver:

```env
# .env
CACHE_DRIVER=redis
```

```php
// config/cache.php
'default' => env('CACHE_DRIVER', 'redis'),
```

## How It Works

**Standard ThrottleRequests (potential race condition):**
```
Request 1: READ count=59 → CHECK < 60 → PASS → WRITE count=60
Request 2: READ count=59 → CHECK < 60 → PASS → WRITE count=60
Request 3: READ count=60 → CHECK >= 60 → BLOCKED
```

Both Request 1 and 2 might pass because they read before either wrote.

**ThrottleRequestsWithRedis (atomic):**
```
Request 1: INCR + CHECK in atomic Lua script → PASS (count=60)
Request 2: INCR + CHECK in atomic Lua script → BLOCKED (count=61, over limit)
```

## Rate Limiting Best Practices

```php
// Multiple rate limits
Route::middleware([
    'throttle:api',        // 60 per minute general limit
    'throttle:sensitive',  // 10 per minute for sensitive endpoints
])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Custom response headers
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)
        ->by($request->user()?->id ?: $request->ip())
        ->response(function (Request $request, array $headers) {
            return response('Rate limit exceeded', 429, $headers);
        });
});
```

## ShieldCI Configuration

This analyzer:
- Runs in **all environments including CI**
- Skips if Redis is not used by the application
- Checks the middleware alias for 'throttle'
- Scans routes for explicit ThrottleRequests usage

## Verification

```bash
# Check which throttle middleware is used
php artisan tinker
>>> app(\Illuminate\Contracts\Http\Kernel::class)->getMiddlewareAliases()['throttle']
=> "Illuminate\Routing\Middleware\ThrottleRequestsWithRedis"

# Test rate limiting
for i in {1..65}; do curl -s -o /dev/null -w "%{http_code}\n" http://yourapp.test/api/endpoint; done
```

## References

- [Laravel Rate Limiting Documentation](https://laravel.com/docs/routing#rate-limiting)
- [ThrottleRequestsWithRedis Source](https://github.com/laravel/framework/blob/master/src/Illuminate/Routing/Middleware/ThrottleRequestsWithRedis.php)
- [Redis Lua Scripting](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)

## Related Analyzers

- [Redis Rate Limiting Analyzer](/analyzers/performance/redis-rate-limiting) - For job queue rate limiting
- [Cache Driver Analyzer](/analyzers/performance/cache-driver) - Ensures optimal cache driver
- [Login Throttling Analyzer](/analyzers/security/login-throttling) - Ensures login attempts are throttled
