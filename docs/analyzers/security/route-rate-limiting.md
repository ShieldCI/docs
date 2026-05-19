---
title: Route Rate Limiting Analyzer
description: Validates that public API endpoints have rate limiting configured to prevent abuse and brute force attacks
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

Validates that public API endpoints have rate limiting. Checks for:

- Custom rate limiter definitions in service providers (`RateLimiter::for()`)
- `Limit::none()` usage in rate limiter definitions (effectively disables limiting)
- API routes without throttle middleware
- Login, register, password reset, email verification, and 2FA/OTP routes without strict throttle (reported as **High** severity - brute force risk)
- Webhook routes without throttle middleware (severity reduced to Low when webhook signature verification middleware is present)
- Global rate limiter in API middleware group
- Skips auth route checks automatically when Laravel Fortify or Jetstream is installed (they provide built-in throttling)

## Why It Matters

- **API Abuse:** Unthrottled APIs allow data scraping, enumeration, and denial of service
- **Brute Force:** Login/register endpoints without rate limiting allow credential stuffing attacks
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

    RateLimiter::for('auth', function (Request $request) {
        return Limit::perMinute(5)->by($request->ip());
    });

    RateLimiter::for('webhooks', function (Request $request) {
        return Limit::perMinute(120)->by($request->ip());
    });
}
```

**2. Apply to authentication routes:**

```php
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:auth');

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:auth');
```

**3. Apply to webhook routes:**

```php
Route::post('/webhooks/stripe', WebhookController::class)
    ->middleware('throttle:webhooks');
```

**4. Set global API throttle:**

```php
// bootstrap/app.php (Laravel 11+)
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: ['throttle:api']);
})
```

## References

- [Laravel Rate Limiting](https://laravel.com/docs/routing#rate-limiting)
- [Laravel Throttle Middleware](https://laravel.com/docs/routing#throttling-with-redis)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

## Related Analyzers

- [Login Throttling](/analyzers/security/login-throttling) - Detects missing auth rate limiting
- [CORS Configuration](/analyzers/security/cors-config) - Validates cross-origin settings
- [Redis Throttling](/analyzers/performance/redis-throttling) - Suggests Redis-based throttling
