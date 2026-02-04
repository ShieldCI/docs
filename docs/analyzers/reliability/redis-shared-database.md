---
title: Redis Shared Database Analyzer
description: Detects when multiple Laravel services share the same Redis database number causing data loss risks
icon: layers
outline: [2, 3]
tags: redis,database,shared,isolation,reliability
---

# Redis Shared Database Analyzer

| Analyzer ID             | Category       | Severity | Time To Fix |
| ------------------------| :------------: |:--------:| -----------:|
| `redis-shared-database` | ✅ Reliability |   High   | 5 minutes   |

## What This Checks

- Detects when Redis cache shares the same database number with queue connections (running `cache:clear` deletes pending jobs)
- Detects when Redis cache shares the same database number with session storage (running `cache:clear` logs out all users)
- Detects when Redis cache shares the same database number with broadcasting
- Detects when Redis cache shares the same database number with Laravel Horizon (running `cache:clear` clears Horizon metrics and pending jobs)
- Considers unique prefixes as a valid alternative to separate databases (if both connections have distinct, non-empty prefixes they are treated as isolated)
- Supports Redis cluster configurations by comparing cluster prefixes instead of database numbers
- Builds connection identifiers from `host:port:database` to detect collisions even across named connections

## Why It Matters

- **Accidental data loss**: Running `php artisan cache:clear` is a routine maintenance operation, but when cache shares a database with queues or sessions it silently deletes all queued jobs and user sessions
- **Cache eviction side effects**: If an eviction policy like `allkeys-lru` is active, Redis may evict queue jobs or session data to make room for cache entries
- **Debugging difficulty**: When cache, queue, and session keys are mixed in the same database, diagnosing issues with `redis-cli KEYS *` becomes a guessing game
- **Deployment failures**: Automated deployment scripts that clear cache between releases can cause production outages by destroying active sessions and pending background jobs
- **Horizon data loss**: Clearing the shared database removes Horizon's job metrics, failed job tracking, and supervision state

## How to Fix

### Quick Fix (2 minutes)

Assign different Redis database numbers to each service in `config/database.php`:

```php
// config/database.php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    // Default connection (cache)
    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_DB', 0),          // Database 0 for cache
    ],

    // Queue connection
    'queue' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_QUEUE_DB', 1),    // Database 1 for queue
    ],

    // Session connection
    'session' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_SESSION_DB', 2),  // Database 2 for sessions
    ],
],
```

Then point each service to its dedicated connection:

```php
// config/cache.php
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',   // Uses database 0
],
```

```php
// config/queue.php
'redis' => [
    'driver' => 'redis',
    'connection' => 'queue',     // Uses database 1
    'queue' => 'default',
    'retry_after' => 90,
],
```

```php
// config/session.php
'driver' => 'redis',
'connection' => 'session',      // Uses database 2
```

### Proper Fix (5 minutes)

#### 1: Full Isolation with Environment Variables

```bash
# .env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_QUEUE_DB=1
REDIS_SESSION_DB=2
REDIS_BROADCAST_DB=3
REDIS_HORIZON_DB=4
```

```php
// config/database.php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_DB', 0),
    ],

    'queue' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_QUEUE_DB', 1),
    ],

    'session' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_SESSION_DB', 2),
    ],

    'broadcast' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_BROADCAST_DB', 3),
    ],

    'horizon' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_HORIZON_DB', 4),
    ],
],
```

#### 2: Configure Each Service

```php
// config/cache.php
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
    ],
],
```

```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'queue',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
    ],
],
```

```php
// config/session.php
return [
    'driver' => env('SESSION_DRIVER', 'redis'),
    'connection' => 'session',
    'lifetime' => env('SESSION_LIFETIME', 120),
];
```

```php
// config/broadcasting.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'broadcast',
    ],
],
```

```php
// config/horizon.php
return [
    'use' => 'horizon',  // Dedicated Horizon connection
    // ...
];
```

#### 3: Alternative -- Prefix-Based Isolation (Redis Clusters)

When using Redis clusters (which do not support multiple databases), use unique prefixes instead:

```php
// config/database.php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => 0,
        'prefix' => 'cache:',
    ],

    'queue' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => 0,
        'prefix' => 'queue:',
    ],

    'session' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => 0,
        'prefix' => 'session:',
    ],
],
```

**Note:** The analyzer recognizes unique prefixes as valid isolation. Both connections must have non-empty, distinct prefixes for this to pass.

#### 4: Verify Isolation

```bash
# Check which keys exist in each database
redis-cli -n 0 DBSIZE   # Cache database
redis-cli -n 1 DBSIZE   # Queue database
redis-cli -n 2 DBSIZE   # Session database

# Safely clear only cache
php artisan cache:clear
# Queue jobs and sessions remain untouched
```


## References

- [Laravel Redis Configuration](https://laravel.com/docs/redis#configuration)
- [Laravel Cache Configuration](https://laravel.com/docs/cache#configuration)
- [Laravel Queue Configuration](https://laravel.com/docs/queues#driver-prerequisites)
- [Laravel Session Configuration](https://laravel.com/docs/session#configuration)
- [Laravel Horizon Configuration](https://laravel.com/docs/horizon#configuration)
- [Redis SELECT Command](https://redis.io/commands/select/)

## Related Analyzers

- [Redis Eviction Policy Analyzer](/analyzers/reliability/redis-eviction-policy) - Validates Redis eviction policy is appropriate for your workload
- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures shared cache backends use unique prefixes
- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
