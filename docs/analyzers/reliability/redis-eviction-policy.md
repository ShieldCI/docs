---
title: Redis Eviction Policy Analyzer
description: Checks Redis eviction policy is properly configured for the workload type
icon: trash-2
outline: [2, 3]
tags: redis,eviction,memory,reliability,configuration,infrastructure,cache,queue
pro: true
---

# Redis Eviction Policy Analyzer

| Analyzer ID              | Category       | Severity | Time To Fix |
| -------------------------| :------------: |:--------:| -----------:|
| `redis-eviction-policy`  | ✅ Reliability |   High   | 10 minutes  |

## What This Checks

- Queries the live Redis server for the current `maxmemory-policy` via `CONFIG GET`
- Validates the eviction policy is appropriate based on how your application uses Redis (cache, queue, session, Horizon)
- Detects when a cache-only Redis server uses `noeviction` (causes write errors when memory is full)
- Detects when Redis stores persistent data (queues, sessions, Horizon) with an eviction policy that could delete jobs or sessions
- Checks whether `maxmemory` is configured (warns if unlimited)
- Monitors memory usage and warns when consumption exceeds 90% of the configured limit
- Only runs in production and staging environments (skipped in CI and local)

## Why It Matters

- **Data loss**: If Redis stores queue jobs or sessions and uses an LRU/LFU eviction policy, pending jobs can be silently deleted when memory pressure occurs
- **Write failures**: The default `noeviction` policy returns errors on writes when memory is full -- if Redis is only used for caching, this causes application errors instead of gracefully evicting stale entries
- **Silent degradation**: Users get logged out unexpectedly when session data is evicted, or background jobs disappear without any error in application logs
- **Memory exhaustion**: Without a `maxmemory` limit, Redis can consume all available system memory, causing OOM kills in containerized environments
- **Production outages**: Memory-related Redis failures cascade to every part of the application that depends on it

## How to Fix

### Quick Fix (2 minutes)

Check and set the eviction policy directly on your Redis server:

```bash
# Check current policy
redis-cli CONFIG GET maxmemory-policy

# For cache-only servers: allow eviction of least-frequently-used keys
redis-cli CONFIG SET maxmemory-policy allkeys-lfu

# For servers storing persistent data (queues, sessions): prevent eviction
redis-cli CONFIG SET maxmemory-policy noeviction

# Set a memory limit (required for eviction policies to work)
redis-cli CONFIG SET maxmemory 2gb

# Persist changes to redis.conf
redis-cli CONFIG REWRITE
```

### Proper Fix (10 minutes)

#### 1: Separate Redis Instances by Workload

The best practice is to use different Redis instances (or at minimum, different databases) for cache vs persistent data:

```php
// config/database.php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    // Cache instance - use allkeys-lfu eviction
    'cache' => [
        'host' => env('REDIS_CACHE_HOST', '127.0.0.1'),
        'port' => env('REDIS_CACHE_PORT', 6380),
        'database' => env('REDIS_CACHE_DB', 0),
    ],

    // Queue/Session instance - use noeviction
    'persistent' => [
        'host' => env('REDIS_PERSISTENT_HOST', '127.0.0.1'),
        'port' => env('REDIS_PERSISTENT_PORT', 6381),
        'database' => env('REDIS_PERSISTENT_DB', 0),
    ],
],
```

```php
// config/cache.php
'redis' => [
    'driver' => 'redis',
    'connection' => 'cache',  // Uses cache Redis instance
],
```

```php
// config/queue.php
'redis' => [
    'driver' => 'redis',
    'connection' => 'persistent',  // Uses persistent Redis instance
    'queue' => 'default',
    'retry_after' => 90,
],
```

```php
// config/session.php
'driver' => 'redis',
'connection' => 'persistent',  // Uses persistent Redis instance
```

#### 2: Configure Redis Server Settings

For the **cache** Redis instance (`redis-cache.conf`):

```ini
maxmemory 2gb
maxmemory-policy allkeys-lfu
```

For the **persistent** Redis instance (`redis-persistent.conf`):

```ini
maxmemory 1gb
maxmemory-policy noeviction
appendonly yes
```

#### 3: Environment-Specific Configuration

```bash
# .env (production)
REDIS_CACHE_HOST=redis-cache.internal
REDIS_CACHE_PORT=6379
REDIS_PERSISTENT_HOST=redis-persistent.internal
REDIS_PERSISTENT_PORT=6379
```

#### 4: Monitor Memory Usage

Set up monitoring to alert before Redis reaches its memory limit:

```bash
# Check memory usage
redis-cli INFO memory | grep used_memory_human
redis-cli INFO memory | grep maxmemory_human

# Check eviction stats
redis-cli INFO stats | grep evicted_keys
```

### Eviction Policy Reference

| Policy | Behavior | Best For |
| --- | --- | --- |
| `noeviction` | Returns error on write when full | Queues, sessions, persistent data |
| `allkeys-lfu` | Evicts least frequently used keys | General-purpose cache (Redis 4+) |
| `allkeys-lru` | Evicts least recently used keys | General-purpose cache |
| `volatile-lfu` | Evicts LFU keys with TTL set | Mixed cache + persistent on same instance |
| `volatile-lru` | Evicts LRU keys with TTL set | Mixed cache + persistent on same instance |
| `volatile-ttl` | Evicts keys closest to expiry | Time-sensitive cache entries |
| `allkeys-random` | Evicts random keys | Uniform access patterns |

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging, since Redis configuration in those environments typically does not reflect production settings.

## References

- [Redis Eviction Policies](https://redis.io/docs/reference/eviction/)
- [Redis Configuration - maxmemory](https://redis.io/docs/management/config/)
- [Laravel Redis Configuration](https://laravel.com/docs/redis)
- [Laravel Cache Configuration](https://laravel.com/docs/cache)

## Related Analyzers

- [Redis Shared Database Analyzer](/analyzers/reliability/redis-shared-database) - Detects when cache, queue, and session share the same Redis database
- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures shared cache backends use unique prefixes
- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
