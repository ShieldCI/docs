---
title: Redis Status Analyzer
description: Verifies Redis connectivity, health, and configuration across all connections
icon: database
outline: [2, 3]
tags: redis,status,connection,reliability,cache
---

# Redis Status Analyzer

| Analyzer ID    | Category       | Severity | Time To Fix |
| -------------- | :------------: | :------: | ----------: |
| `redis-status` | ✅ Reliability | Critical | 15 minutes  |

## What This Checks

This analyzer verifies Redis connectivity, health, and configuration across all configured connections. It performs a comprehensive series of checks on each Redis connection:

- **PING test** - Sends a `PING` command and expects a `PONG` response to verify basic connectivity and authentication
- **Read/write verification** - Writes a test key with a 60-second TTL, reads it back, and verifies the value matches, then cleans up
- **Memory usage** - Retrieves Redis `INFO` and checks memory usage against `maxmemory`; warns at 80% usage, critical at 95%
- **Connected clients** - Monitors connected client count against `maxclients`; warns at 80% capacity
- **Persistence configuration** - For connections used by queues or sessions, verifies that AOF or RDB persistence is enabled
- **All connections** - Tests every configured Redis connection (from `database.redis`), not just the default

::: tip When This Analyzer Runs
This analyzer only runs when the application actively uses Redis for at least one of:
- Cache (`cache.default` driver is `redis`)
- Queue (`queue.default` driver is `redis`)
- Session (`session.driver` is `redis`)
- Broadcasting (`broadcasting.default` is `redis`)

It is automatically skipped in CI environments (`$runInCI = false`).
:::

## Why It Matters

Redis is a critical infrastructure component for many Laravel applications. When Redis fails or degrades:

- **Cache failures** - Application performance degrades dramatically as every request hits the database
- **Queue processing halts** - Queued jobs (emails, payments, notifications) stop being processed entirely
- **Session loss** - Users are logged out and lose in-progress work if sessions are stored in Redis
- **Broadcasting failures** - Real-time features (websockets, notifications) stop working
- **Memory exhaustion** - Redis running out of memory can cause key eviction, leading to cache stampedes and data loss
- **Connection exhaustion** - Running out of client connections blocks all new application requests
- **Data loss on restart** - Without persistence (AOF/RDB), queue jobs and session data are lost on Redis restart

## How to Fix

### Quick Fix

1. Verify Redis is running and accessible:

```bash
# Check if Redis server is running
redis-cli ping
# Expected: PONG

# Check Redis status
sudo systemctl status redis

# Start Redis if not running
sudo systemctl start redis
```

2. Update `.env` with correct connection details:

```ini
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

3. Test the connection from Laravel:

```bash
php artisan tinker
>>> Illuminate\Support\Facades\Redis::connection()->ping()
```

### Proper Fix

1. **Configure Redis connections properly** in `config/database.php`:

```php
// config/database.php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
    ],

    'cache' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '1'),
    ],

    'queue' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_QUEUE_DB', '2'),
    ],
],
```

2. **Enable persistence for queue and session connections**:

```bash
# redis.conf - Enable AOF (recommended for queues/sessions)
appendonly yes
appendfsync everysec

# Enable RDB snapshots as backup
save 900 1
save 300 10
save 60 10000
```

3. **Configure memory limits**:

```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

4. **Monitor connection limits**:

```bash
# redis.conf - increase if needed
maxclients 10000
```

5. **Handle high memory situations**:

```php
// Clear cache if memory is high
php artisan cache:clear

// Or selectively clear tags
Cache::tags(['reports'])->flush();
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments.

**Specify which Redis connections to check:**

```php
// config/shieldci.php
'redis_connections' => ['default', 'cache', 'queue'],
```

If `redis_connections` is not configured, the analyzer automatically tests all connections defined in `database.redis` (excluding the `client` and `options` keys).

**When to run this analyzer:**
- ✅ **Local development**: Ensures Redis is accessible during development
- ✅ **Staging/Production servers**: Confirms Redis health and configuration
- ✅ **After infrastructure changes**: Run after Redis upgrades, migrations, or configuration changes
- ❌ **CI/CD pipelines**: Skipped automatically (Redis may not be available)

## References

- [Laravel Redis Configuration](https://laravel.com/docs/redis)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Redis Memory Optimization](https://redis.io/docs/management/optimization/memory-optimization/)
- [Redis Administration](https://redis.io/docs/management/admin/)

## Related Analyzers

- [Database Status Analyzer](/analyzers/reliability/database-status) - Validates database connectivity and functionality
- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Horizon Provisioning Plan Analyzer](/analyzers/reliability/horizon-provisioning-plan) - Validates Horizon supervisor configuration (requires Redis)
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Validates queue worker timeout settings

---
