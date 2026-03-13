---
title: Octane Configuration Analyzer
description: Validates Laravel Octane configuration for long-running server reliability including memory management and state isolation
icon: shield
outline: [2, 3]
tags: reliability,octane,performance,configuration,server
pro: true
---

# Octane Configuration Analyzer

| Analyzer ID     |     Category      | Severity | Time To Fix  |
|-----------------|:-----------------:|:--------:| ------------:|
| `octane-config` |   ✅ Reliability  | High     | 15 minutes   |

## What This Checks

Validates Laravel Octane configuration for safe long-running server operation. Checks for:

- Singleton bindings in service providers that may leak state between requests
- Max execution time configuration (missing or too high)
- Max requests setting to prevent memory leaks (workers that never restart)
- Listener resets for stateful services (auth, translator, etc.)
- Warm services for performance optimization

## Why It Matters

- **State Leakage:** Singleton bindings persist across requests, potentially leaking user data between sessions
- **Memory Leaks:** Without max request limits, workers accumulate memory until the server crashes
- **Runaway Requests:** Without execution time limits, a single slow request can block a worker indefinitely
- **Security:** Stateful services (auth guards, etc.) must be reset between requests to prevent user impersonation

## How to Fix

### Quick Fix (5 minutes)

Publish and configure Octane:

```bash
php artisan vendor:publish --tag=octane-config
```

Set basic safety limits:

```php
// config/octane.php
'max_execution_time' => 30,
'max_requests' => 500,
```

### Proper Fix (15 minutes)

**1. Configure state isolation:**

```php
// config/octane.php
'flush' => [
    // Services to reset between requests
    'auth',
    'auth.driver',
    'translator',
    'session',
    'session.store',
],

'listeners' => [
    RequestReceived::class => [
        // Custom listeners to reset state
        ResetSingletons::class,
    ],
],
```

**2. Avoid problematic singletons:**

**Before (❌):**
```php
// app/Providers/AppServiceProvider.php
$this->app->singleton(CartService::class, function () {
    return new CartService(); // State leaks between requests!
});
```

**After (✅):**
```php
$this->app->bind(CartService::class, function () {
    return new CartService(); // Fresh instance per request
});
```

**3. Configure warm services for performance:**

```php
// config/octane.php
'warm' => [
    // Services to pre-resolve for all workers
    DatabaseManager::class,
    CacheManager::class,
],
```

**4. Set appropriate limits:**

```php
// config/octane.php
'max_execution_time' => 30,      // 30 seconds per request
'max_requests' => 500,            // Restart worker after 500 requests
```

## References

- [Laravel Octane Documentation](https://laravel.com/docs/octane)
- [Laravel Octane Configuration](https://laravel.com/docs/octane#dependency-injection-and-octane)
- [Swoole Documentation](https://wiki.swoole.com/)

## Related Analyzers

- [Vapor Configuration](/analyzers/reliability/vapor-config) - Validates serverless deployment config
- [Queue Timeout](/analyzers/reliability/queue-timeout-configuration) - Checks queue timeout settings
- [Session Driver](/analyzers/performance/session-driver) - Validates session configuration
