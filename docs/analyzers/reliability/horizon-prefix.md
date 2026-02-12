---
title: Horizon Prefix Analyzer
description: Validates Horizon uses a unique prefix to prevent Redis collisions in shared environments
icon: hash
outline: [2, 3]
tags: horizon,prefix,redis,reliability,configuration
pro: true
---

# Horizon Prefix Analyzer

| Analyzer ID       | Category       | Severity | Time To Fix |
| ------------------| :------------: |:--------:| -----------:|
| `horizon-prefix`  | ✅ Reliability |   High   | 5 minutes   |

## What This Checks

- Ensures the Horizon prefix is set and is not a generic value (`laravel_horizon:`, `horizon:`, `laravel:`, `horizon_`, or empty)
- Validates that the Horizon prefix differs from the cache prefix to avoid key collisions
- Detects when prefixes are too similar (one is a prefix of the other)
- Recommends including the environment name in the prefix for multi-environment deployments
- Generates app-name-based prefix suggestions using the application name and environment
- Only runs when Laravel Horizon is installed and configured

## Why It Matters

- **Job data collisions**: When multiple Laravel applications share the same Redis server with generic prefixes, jobs from one app can be picked up by another app's workers
- **Metrics contamination**: Horizon dashboard metrics from different applications mix together, making monitoring unreliable
- **Supervision conflicts**: Multiple Horizon instances with the same prefix interfere with each other's supervisor management, causing workers to be started or stopped unexpectedly
- **Multi-environment interference**: Staging and production sharing a Redis server with identical prefixes can cause production jobs to be consumed by staging workers (or vice versa)
- **Cache key collisions**: When the Horizon prefix overlaps with the cache prefix, Horizon internal keys may conflict with application cache keys

## How to Fix

### Quick Fix

Set a unique Horizon prefix in `config/horizon.php`:

```php
// ❌ Before: Generic prefix (default)
'prefix' => env(
    'HORIZON_PREFIX',
    'laravel_horizon:'
),

// ✅ After: App-specific prefix with environment
'prefix' => env(
    'HORIZON_PREFIX',
    'myapp_production_horizon:'
),
```

Or set it via your `.env` file:

```bash
# .env
HORIZON_PREFIX=myapp_production_horizon:
```

### Proper Fix

#### 1: Use environment-aware prefixes

```php
// config/horizon.php
return [
    'prefix' => env(
        'HORIZON_PREFIX',
        config('app.name', 'laravel') . '_' . config('app.env', 'production') . '_horizon:'
    ),

    // ... rest of Horizon config
];
```

#### 2: Ensure cache prefix is distinct

```php
// config/cache.php
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
        'prefix' => env('CACHE_PREFIX', 'myapp_production_cache:'),
    ],
],

// config/horizon.php
'prefix' => env('HORIZON_PREFIX', 'myapp_production_horizon:'),
```

The prefixes should be clearly distinct:

```bash
# ❌ Bad: Overlapping prefixes
CACHE_PREFIX=myapp:
HORIZON_PREFIX=myapp:horizon:

# ✅ Good: Distinct prefixes
CACHE_PREFIX=myapp_production_cache:
HORIZON_PREFIX=myapp_production_horizon:
```

#### 3: Set per-environment values in `.env`

```bash
# Production .env
HORIZON_PREFIX=myapp_prod_horizon:
CACHE_PREFIX=myapp_prod_cache:

# Staging .env
HORIZON_PREFIX=myapp_staging_horizon:
CACHE_PREFIX=myapp_staging_cache:
```

#### 4: Use separate Redis databases per environment

For stronger isolation when sharing a single Redis server:

```php
// config/database.php
'redis' => [
    'horizon' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_HORIZON_DB', '2'),
    ],
    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '1'),
    ],
],
```

```php
// config/horizon.php
'use' => 'horizon',  // Use dedicated Redis connection
'prefix' => env('HORIZON_PREFIX', 'myapp_prod_horizon:'),
```


## References

- [Laravel Horizon Configuration](https://laravel.com/docs/horizon#configuration)
- [Laravel Redis Configuration](https://laravel.com/docs/redis#configuration)
- [Redis Key Naming Best Practices](https://redis.io/docs/manual/patterns/)

## Related Analyzers

- [Horizon Status Analyzer](/analyzers/reliability/horizon-status) - Monitors Horizon runtime status and health
- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures cache prefix is set to avoid collisions
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
