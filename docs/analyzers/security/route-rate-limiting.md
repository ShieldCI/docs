---
title: Route Rate Limiting Analyzer
description: Validates that public API endpoints have rate limiting configured to prevent abuse and denial of service
icon: lock
outline: [2, 3]
tags: security,rate-limiting,throttle,api,routes
pro: true
---

# Route Rate Limiting Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `route-rate-limiting` | 🛡️ Security  | Medium    | 15 minutes   |

## What This Checks

Validates that public API endpoints have rate limiting configured. Checks for:

- Custom rate limiter definitions in service providers (`RateLimiter::for()`)
- `Limit::none()` usage in rate limiter definitions (effectively disables limiting)
- API routes without throttle middleware
- Webhook routes without throttle middleware (severity reduced to Low when webhook signature verification middleware is present)
- Global rate limiter in API middleware group

::: tip Auth route throttle checking
Login, register, and password reset route throttling is handled by the [Login Throttling](/analyzers/security/login-throttling) analyzer, which provides deeper inspection including controller-level detection and Fortify/Breeze/Jetstream awareness.
:::

## Why It Matters

- **API Abuse:** Unthrottled APIs allow data scraping, enumeration, and denial of service
- **Webhook Flooding:** Unthrottled webhook routes can be abused to overload your queue
- **Cost:** Cloud infrastructure bills spike when APIs are abused at scale

## How to Fix

### Quick Fix (5 minutes)

Add throttle middleware to API routes:

```php
// routes/api.php
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('posts', PostController::class);
});
```

### Proper Fix (15 minutes)

**1. Define custom rate limiters:**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });

    RateLimiter::for('webhooks', function (Request $request) {
        return Limit::perMinute(120)->by($request->ip());
    });
}
```

**2. Apply to webhook routes:**

```php
Route::post('/webhooks/stripe', WebhookController::class)
    ->middleware('throttle:webhooks');
```

**3. Set global API throttle:**

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: ['throttle:api']);
})
```

```php [Laravel 10]
// app/Http/Kernel.php
protected $middlewareGroups = [
    'api' => ['throttle:api', /* other middleware */],
];
```
:::

## References

- [Laravel Rate Limiting](https://laravel.com/docs/routing#rate-limiting)
- [Laravel Throttle Middleware](https://laravel.com/docs/routing#throttling-with-redis)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

## Related Analyzers

- [Login Throttling](/analyzers/security/login-throttling) - Detects missing rate limiting on auth routes (login, register, password reset)
- [CORS Configuration](/analyzers/security/cors-config) - Validates cross-origin settings
- [Redis Throttling](/analyzers/performance/redis-throttling) - Suggests Redis-based throttling for high-traffic APIs
