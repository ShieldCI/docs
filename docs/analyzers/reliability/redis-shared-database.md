---
title: Redis Shared Database Analyzer
description: Detects when multiple Laravel services share the same Redis database number causing data loss risks
icon: layers
outline: [2, 3]
tags: redis,database,shared,isolation,reliability,infrastructure,cache,queue,session,configuration
pro: true
---

# Redis Shared Database Analyzer

| Analyzer ID             | Category       | Severity | Time To Fix |
| ------------------------| :------------: |:--------:| -----------:|
| `redis-shared-database` | ✅ Reliability |   High   | 5 minutes   |

## What This Checks

- Detects when Redis cache shares the same database number with queue connections (running `cache:clear` deletes pending jobs)
- Detects when Redis cache shares the same database number with session storage (running `cache:clear` logs out all users)
- Detects when Redis cache shares the same database number with Laravel Horizon (running `cache:clear` clears Horizon metrics and pending jobs)
- Builds connection identifiers from `host:port:database` to detect collisions even across named connections
- Resolves connections defined by a `url` (e.g. `tls://user:pass@host:6380?database=1`) to their real host, port, and database — matching Laravel's own connector, where `url` takes precedence over the discrete `host`/`port`/`database` keys
- Supports Redis cluster configurations by comparing cluster connection names
- Does **not** treat key prefixes as isolation: `cache:clear` calls Redis `FLUSHDB`, which deletes every key in the database regardless of prefix (broadcasting is not checked — Redis pub/sub is not persisted as keys and is unaffected by `FLUSHDB`)

## Why It Matters

- **Accidental data loss**: Running `php artisan cache:clear` is a routine maintenance operation, but when cache shares a database with queues or sessions it silently deletes all queued jobs and user sessions
- **Cache eviction side effects**: If an eviction policy like `allkeys-lru` is active, Redis may evict queue jobs or session data to make room for cache entries
- **Debugging difficulty**: When cache, queue, and session keys are mixed in the same database, diagnosing issues with `redis-cli KEYS *` becomes a guessing game
- **Deployment failures**: Automated deployment scripts that clear cache between releases can cause production outages by destroying active sessions and pending background jobs
- **Horizon data loss**: Clearing the shared database removes Horizon's job metrics, failed job tracking, and supervision state

## How to Fix

Isolate the cache so it resolves to a **different physical Redis database** than queues, sessions, and Horizon. Key prefixes do **not** count — `cache:clear` calls `FLUSHDB`, which wipes the entire database regardless of prefix.

### Quick Fix (2 minutes)

On a self-hosted Redis that supports multiple databases (Forge, Docker), give the cache its own database number:

```bash
# .env
REDIS_CACHE_DB=1
```

This does **not** work on managed single-database Redis (Laravel Valkey, Upstash, ElastiCache cluster mode), where `SELECT 1` collapses to database 0 — and that is exactly the environment that produces this finding, since the default Laravel skeleton isolates cache purely by `REDIS_CACHE_DB`. The one-line escape hatch that works anywhere is to take the cache off Redis entirely:

```bash
# .env
CACHE_STORE=database
```

For a Redis-backed cache on managed/single-database Redis, use the Proper Fix below.

### Proper Fix (5 minutes)

Give the cache its own Redis instance so it is isolated regardless of multi-database support. This is the only option that works on managed single-database Redis, and `cache:clear` then only flushes the dedicated cache instance.

#### 1: Point the cache at a separate instance via environment

```bash
# .env
REDIS_URL=tls://default:password@redis-data.example:6379        # queues, sessions, Horizon
REDIS_CACHE_URL=tls://default:password@redis-cache.example:6379 # cache only
```

#### 2: Configure the connections

```php
// config/database.php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    // Persistent data: queues, sessions, Horizon
    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_DB', 0),
    ],

    // Dedicated cache instance on a different server
    'cache' => [
        'url' => env('REDIS_CACHE_URL'),
        'host' => env('REDIS_CACHE_HOST', '127.0.0.1'),
        'port' => env('REDIS_CACHE_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 0),
    ],
],
```

```php
// config/cache.php
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',  // dedicated cache instance
    ],
],
```

When `url` is set it takes precedence over the discrete `host`/`port`/`database` keys, matching Laravel's connector — so the cache connection is compared by the real server in the URL.

#### 3: Multi-database alternative (self-hosted only)

When the Redis server supports multiple databases, a dedicated cache instance is not required — give each service its own database number instead:

```bash
# .env
REDIS_DB=0
REDIS_CACHE_DB=1
REDIS_QUEUE_DB=2
REDIS_SESSION_DB=3
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

    'cache' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 1),
    ],

    'queue' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_QUEUE_DB', 2),
    ],

    'session' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_SESSION_DB', 3),
    ],

    'horizon' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_HORIZON_DB', 4),
    ],
],
```

Then point each service at its connection (`config/cache.php` → `cache`, `config/queue.php` → `queue`, `config/session.php` → `session`, `config/horizon.php` `'use' => 'horizon'`).

#### 4: Verify Isolation

```bash
# Cache and persistent data should report from different servers/databases
redis-cli -u "$REDIS_CACHE_URL" DBSIZE
redis-cli -u "$REDIS_URL" DBSIZE

# Clearing cache must leave queues and sessions untouched
php artisan cache:clear
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
