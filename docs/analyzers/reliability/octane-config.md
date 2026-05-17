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

Validates Laravel Octane 2.x configuration for safe long-running server operation. Checks:

- `config/octane.php` is present when `laravel/octane` is installed
- `server` driver is one of the valid Octane 2.x drivers: `roadrunner`, `swoole`, `frankenphp`
- `max_execution_time` is configured, non-zero, and within a sane bound
- `garbage` (memory-leak guardrail, in MB) is configured, non-zero, and within a sane bound
- Service-provider singletons that capture per-request services (`Application`, `Request`, `Auth\Guard`, `Session`, `Authenticatable`) and therefore leak stale state across Octane requests

The analyzer reads `config/octane.php` via AST, so it is comment-safe and correctly resolves `env()`-wrapped values.

### Checks intentionally not performed

- **`max_requests`** — this is a `php artisan octane:start --max-requests=N` CLI flag, not a config key. Set it in Supervisor or your Procfile, not `config/octane.php`.
- **`warm`, `flush`, `listeners` presence** — Octane's published stub ships sane defaults for all three. Their presence is not flagged.
- **Blanket singleton detection** — stateless singletons (Repository, Service, Gateway) are the recommended Laravel pattern and are Octane-safe. Only singletons that capture per-request services are flagged.

### Platforms skipped

The analyzer is automatically skipped on Laravel Vapor (serverless architecture is incompatible with Octane).

## Why It Matters

- **State leakage:** Singletons that capture per-request services (Request, Auth Guard, Session) persist across requests, leaking user data between sessions.
- **Memory growth:** Without a `garbage` threshold, workers that leak memory are never recycled until the server OOMs.
- **Runaway requests:** `max_execution_time = 0` (or missing) means a single slow request can block a worker forever.
- **Wrong driver:** `openswoole` was dropped in Octane 2.x. A config that still references it will fail to boot.

## How to Fix

### Quick Fix (15 minutes)

If `config/octane.php` is missing, publish it and configure the required limits:

```bash
php artisan vendor:publish --tag=octane-config
```

Then set sane values in `config/octane.php`:

```php
'server'             => env('OCTANE_SERVER', 'roadrunner'),
'max_execution_time' => 30,  // seconds; 0 disables (not recommended)
'garbage'            => 50,  // MB; recycle worker once heap exceeds this
```

### Proper Fix (15 minutes)

For stale-capture singletons, replace singleton bindings that inject per-request services (`Application`, `Request`, `Auth\Guard`, `Session`, `Authenticatable`) with `scoped()` bindings or inject the dependency at call time instead.

**Before (❌):**
```php
$this->app->singleton('cart', function (Application $app) {
    return new CartService($app->make(Request::class));
});
```

**After (✅):**
```php
// scoped() resets automatically between Octane requests
$this->app->scoped('cart', function ($app) {
    return new CartService();
});
```

Use `$this->app->bind()` when you need a fresh instance on every resolution, or pass the per-request service as a method argument rather than capturing it in the singleton factory.

## ShieldCI Configuration

Both thresholds are config-tunable. Add these keys to `config/shieldci.php` to override:

```php
'analyzers' => [
    'reliability' => [
        'octane-config' => [
            // Warn when max_execution_time exceeds this (Octane default is 30 s)
            'max_execution_time_threshold' => 60,

            // Warn when garbage >= this many MB (Octane default is 50)
            'garbage_threshold_mb' => 256,
        ],
    ],
],
```

## References

- [Laravel Octane Documentation](https://laravel.com/docs/octane)
- [Laravel Octane — Dependency Injection](https://laravel.com/docs/octane#dependency-injection-and-octane)
- [Laravel Octane config source (2.x)](https://github.com/laravel/octane/blob/2.x/config/octane.php)

## Related Analyzers

- [Vapor Configuration](/analyzers/reliability/vapor-config) - Validates serverless deployment config
- [Horizon Status](/analyzers/reliability/horizon-status) - Validates Horizon runtime health
- [Queue Blocking](/analyzers/reliability/queue-blocking) - Validates queue driver and blocking configuration
